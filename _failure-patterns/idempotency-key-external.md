---
layout: pattern
title: Idempotency key (external)
short: idempotency-key-external
group: single-system
description: Send a request to an external system at-least-once with only a single side effect
sort_key: 3
related:
  - at-most-once-guard
  - idempotency-key
  - recovery-point
  - resumable-operation
---

## Context

Some operations involve writing to an external API which has side effects. The API could be called more than once when handling retries, but this might cause any side effects produced by the API to be repeated.

## Example

An API which sends emails.

## Problem

How do we ensure that side effects produced by the API are not repeated, even when we call it more than once?

## Solution

If the API supports it, send an idempotency key so identical requests can be detected. This allows the API to reduce the probability (or eliminate the possibility) of producing the side effect more than once.

Use the same key for every attempt, including after a crash. A key generated in memory for each attempt would be lost in a crash, so either store it before the first attempt (e.g. in a [recovery point]({% link _failure-patterns/recovery-point.md %})), or derive it from something which is already stored, such as the operation's own idempotency key.

APIs usually only remember keys for a limited time, e.g. [24 hours for Stripe](https://docs.stripe.com/api/idempotent_requests). A retry after that is treated as a new request.

If the API does not support idempotency keys, consider using an [at-most-once guard]({% link _failure-patterns/at-most-once-guard.md %}) to prevent calling it more than once. The trade-off is that the side effect might never happen: if a call fails with an [indefinite error]({% link _failure-patterns/glossary.md %}#indefinite-error), we can't safely retry it.
