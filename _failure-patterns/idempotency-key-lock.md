---
layout: pattern
title: Idempotency key lock
short: idempotency-key-lock
group: multiple-systems
tagline: Protect against concurrent retries
related:
  - idempotency-key
  - atomic-read-then-write
incomplete: true
---

## Context

It is possible for retries to arrive while a previous request is still being processed, for example because the client timed out or crashed. Some operations need protecting against concurrent retries, either to avoid race conditions or to prevent duplicate work.

## Example

{% include callout.html
   type="info"
   content="Honestly, I'm struggling to come up with good examples for this one. If you have some ideas, let me know!"
%}

TODO:

- State machine
  - A state machine is tracked in a system without an atomic "check then set" operation
  - E.g. the system has `SET key value` and `GET key` operations
  - and value must follow:

    ```text
    ∅ -> SUCCESS
      `-> FAILURE
    ```

    i.e. no transition from SUCCESS to FAILURE is allowed

  - a request transitions a key through the values as it progresses
  - Race conditions can occur, e.g.
    - Request: `GET x : ∅`
    - Retry: `GET x : ∅`
    - Request: `SET x SUCCESS`
    - Retry: `SET x FAILURE`
  - Solution:
    - Request: Lock idempotency key
    - Retry: Wait for lock...
    - Request: `GET x : ∅`
    - Request: `SET x SUCCESS`
    - Request: Release
    - Retry: ... acquire lock
    - Retry: `GET x : SUCCESS`
    - Retry: Release
  - TODO: why do recovery points not solve this? because they depend on being able to do check-then-set atomically
- At most once (this is essentially another state machine problem)
  - Lock
  - Has operation happened?
    - No: do operation FIXME: timing issue? what if it's started but not finished because a previous attempt started then crashed?
    - Yes: don't
  - Release lock
- Ensure sequentiality?
  - E.g.
    - Lock events table
    - Insert event n
    - Release
    - All events <= n now visible
  - This isn't really an idempotency key lock, it's a lock on the entire table
- A "catch all" mechanism
  - This can sometimes just be easier than thinking about possible concurrency race conditions

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

There are often alternatives to locks, especially if correctness if your goal and your storage system supports [atomic read-then-write operations]({% link _failure-patterns/atomic-read-then-write.md %}).

## See also

- [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
- [Everything I know about distributed locks](https://davidecerbo.medium.com/everything-i-know-about-distributed-locks-2bf54de2df71)
