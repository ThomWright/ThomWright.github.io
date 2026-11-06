---
layout: pattern
title: Single-use token recovery
short: single-use-token-recovery
group: multiple-systems
description: Handle concurrent use of a single-use token
related:
  - resumable-operation
  - recovery-point
  - idempotency-key-lock
  - reject-duplicate
---

## Context

Some external APIs enforce single use themselves. Unlike an [at-most-once guard]({% link _failure-patterns/at-most-once-guard.md %}), where *we* choose to prevent repeat calls, here the external system enforces it: a second attempt to redeem the token is rejected outright. There's no idempotency key to make retries safe, and often no way to read back what an earlier redemption returned.

## Prerequisites

The operation has something acting as an idempotency key, and the result of redeeming the token is persisted (e.g. as a [recovery point]({% link _failure-patterns/recovery-point.md %})) keyed by it. All concurrent redemption attempts sharing that key represent the same logical operation.

## Example

An app lets users redeem gift cards from a partner retailer. The partner's API takes a gift card code, and returns the amount credited. Each code can only be redeemed once: a second attempt is rejected with an "already redeemed" error. The API doesn't support idempotency keys.

If the app's process [crashes]({% link _failure-patterns/glossary.md %}#crash) after a successful redemption but before storing the result, the result is lost for good. Separately, a duplicate request – for example, the user's browser retrying the form submission – could cause two requests to race to redeem the same code.

## Problem

How do we reliably complete an operation that depends on redeeming a single-use token, when retries or concurrent duplicates might race to redeem it?

## Solution

On rejection (token already used), don't treat it as a failure for the whole operation: it means *someone* already redeemed it – possibly an earlier attempt of our own, possibly a concurrent request. Check for a persisted result for this operation's idempotency key, and catch up to it.

1. Check for an existing recovery point for the idempotency key. If found, resume or return from there – the usual start of a [resumable operation]({% link _failure-patterns/resumable-operation.md %}).
2. Otherwise, attempt to redeem the token.
3. On success, persist the result immediately.
4. On rejection (already used):
    1. Re-check for a persisted result. If found, catch up and continue (possibly just returning success).
    2. If not found, the winning request may still be in flight. Retry the check with backoff, bounded by a timeout.
    3. If it still isn't found once that bound is reached, give up and return an error.

{% include callout.html
  type="warning"
  content="If the process crashes after redeeming the token but before persisting the result, that data is usually gone permanently: the token can't be redeemed again, and there's often no way to read back its result. This is an inherent limitation of single-use tokens."
%}

Catch-up relies on a rejected attempt being harmless. Some providers punish reuse instead. For example, [OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2) recommends that reusing an authorization code revokes any tokens already issued from it, so the losing request would invalidate the winner's token. In this case, prevent the second attempt instead, using an [idempotency key lock]({% link _failure-patterns/idempotency-key-lock.md %}) or an [at-most-once guard]({% link _failure-patterns/at-most-once-guard.md %}).

## Alternatives

An [idempotency key lock]({% link _failure-patterns/idempotency-key-lock.md %}) around the redemption step prevents the race entirely: only one concurrent attempt ever calls the API, and others wait, then find the recovery point already written. This avoids needing catch-up logic at all, but trades this for the lock's own complexity and failure modes – timeout versus API latency, crashing while holding it, added latency for waiters.

Prefer catch-up where a rejected attempt is harmless. It needs no lock lifecycle, and stays safe under concurrency by construction.
