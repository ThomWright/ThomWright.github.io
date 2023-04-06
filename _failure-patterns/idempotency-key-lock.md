---
layout: pattern
title: Idempotency key lock
short: idempotency-key-lock
group: multiple-systems
tagline: Protect against concurrent retries
related:
  - idempotency-key
  - atomic-read-then-write
---

## Context

It is possible for retries to arrive while a previous request is still being processed, for example because the client timed out or crashed. Some operations need protecting against concurrent retries, either to avoid race conditions or to prevent duplicate work.

## Example

The result of a process, either `SUCCESS` or `FAILURE`, needs to be recorded in a system without an [atomic read-then-write]({% link _failure-patterns/atomic-read-then-write.md %}) operation. Once written, the record should not change.

{% include figure.html
  img_src="/public/assets/failure-patterns/state-machine-result.png"
  alt="A state machine"
  caption="A state machine with two terminal states"
  size="small"
%}

It would be possible for a race condition to occur, like so:

1. Request: `GET x : ∅`
2. Retry: `GET x : ∅`
3. Request: `SET x SUCCESS`
4. Retry: `SET x FAILURE`

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

Doing this automatically for every top-level write operation can reduce the cognitive load of needing to think through possible concurrency problems, but possibly

## Alternatives

There are often alternatives to locks, especially if correctness if your goal and your storage system supports [atomic read-then-write]({% link _failure-patterns/atomic-read-then-write.md %}) operations.

## See also

- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Everything I know about distributed locks](https://davidecerbo.medium.com/everything-i-know-about-distributed-locks-2bf54de2df71)
