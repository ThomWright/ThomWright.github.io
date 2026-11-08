---
layout: pattern
title: Idempotency key lock
short: idempotency-key-lock
group: multiple-systems
description: Protect against concurrent retries
related:
  - idempotency-key
  - atomic-read-then-write
  - at-most-once-guard
  - response-record
  - recovery-point
  - single-use-token-recovery
---

## Context

It is possible for retries to arrive while a previous request is still being processed – for example because the client received an [indefinite error]({% link _failure-patterns/glossary.md %}#indefinite-error) (a timeout or [crash]({% link _failure-patterns/glossary.md %}#crash)) and retried without knowing whether the first request was still running. Some operations need protecting against concurrent retries, either to avoid race conditions or to prevent duplicate work.

## Example

**Exchanging an OAuth authorization code.** An app lets users connect their bank account. To do this, the app exchanges an authorization code with the bank for an access token. Codes are single-use. If a code is used twice, the bank [should revoke](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2) any tokens already issued for it. A retry that arrives after the first request has finished can return the stored token. But a retry that arrives *during* the first request will also, concurrently, try to perform the exchange, and that second exchange can revoke the first request's token. See [single-use token recovery]({% link _failure-patterns/single-use-token-recovery.md %}).

## Problem

How do we prevent retries from attempting to do work concurrently?

## Solution

Take a lock on the idempotency key:

1. Try to acquire a lock on the idempotency key.
2. If the lock is held, either wait for it, or return an error telling the client to retry later, e.g. HTTP 409 Conflict.
3. Perform the operation.
4. Release the lock.

The lock only stops retries overlapping. A retry that arrives after the lock is released will perform the operation again. Combine the lock with something that makes sequential retries safe, such as a [response record]({% link _failure-patterns/response-record.md %}) or a [recovery point]({% link _failure-patterns/recovery-point.md %}).

{% include callout.html
    type="warning"
    content="All sorts of problems can happen with locks. What happens if the application crashes before releasing it? What if the lock times out before the operation completes? It's worth considering the likelihood and impact of these sorts of scenarios, based on whether you are using the lock for **correctness** or **efficiency**. For correctness, a lock that can time out needs [fencing tokens](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html), so that a process whose lock has expired can't still make changes."
%}

Doing this automatically for every top-level write operation can reduce the cognitive load of needing to think through possible concurrency problems. However, it is often not necessary.

## Alternatives

There are often alternatives to idempotency key locks, especially if correctness is your only goal and your storage system supports [atomic read-then-write]({% link _failure-patterns/atomic-read-then-write.md %}) operations, and if operations on other systems are idempotent.

## See also

- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Everything I know about distributed locks](https://davidecerbo.medium.com/everything-i-know-about-distributed-locks-2bf54de2df71)
