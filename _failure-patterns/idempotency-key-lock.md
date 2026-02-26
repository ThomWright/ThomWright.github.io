---
layout: pattern
title: Idempotency key lock
short: idempotency-key-lock
group: multiple-systems
tagline: Protect against concurrent retries
related:
  - idempotency-key
  - atomic-read-then-write
  - at-most-once-guard
---

## Context

It is possible for retries to arrive while a previous request is still being processed, for example because the client timed out or crashed. Some operations need protecting against concurrent retries, either to avoid race conditions or to prevent duplicate work.

## Example

I can't think of a problem where concurrency specifically is a problem. If you can, please send me one!

## Problem

How do we prevent retries from attempting to do work concurrently?

## Solution

Take a lock on the idempotency key:

1. Try to acquire a lock on the idempotency key.
2. If the lock is held, either wait or return an error.
3. Perform the operation.
4. Release the lock.

{% include callout.html
    type="warning"
    content="All sorts of problems can happen with locks. What happens if the application crashes before releasing it? What if the lock times out before the operation completes? It's worth considering the likelihood and impact of these sorts of scenarios, based on whether you are using the lock for **correctness** or **efficiency**."
%}

Doing this automatically for every top-level write operation can reduce the cognitive load of needing to think through possible concurrency problems. However, it is often not necessary.

## Alternatives

There are often alternatives to idempotency key locks, especially if correctness is your only goal and your storage system supports [atomic read-then-write]({% link _failure-patterns/atomic-read-then-write.md %}) operations, and if operations on other systems are idempotent.

## See also

- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Everything I know about distributed locks](https://davidecerbo.medium.com/everything-i-know-about-distributed-locks-2bf54de2df71)
