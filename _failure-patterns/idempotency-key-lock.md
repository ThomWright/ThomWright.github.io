---
layout: pattern
title: Idempotency key lock
short: idempotency-key-lock
group: multiple-systems
tagline: Protect against concurrent retries
related:
  - atomic-read-then-write
incomplete: true
---

## Context

It is possible for retries to arrive while a previous request is still being processed, for example because the client timed out or crashed. The operation needs protecting against concurrent retries.

## Example

- State machine
  - A state machine is tracked in a system without an atomic "check then set" operation
  - E.g. the system has `SET key value` and `GET key` operations
  - and value must follow:

    ```text
    A -> B -> SUCCESS
          `-> FAILURE
    ```

    or

    ```text
    ∅ -> SUCCESS
      `-> FAILURE
    ```

    i.e. no transition from SUCCESS to FAILURE is allowed

  - a request transitions a key through the values as it progresses
  - Race conditions can occur, e.g.
    - Request: `SET x A`
    - Request: `SET x B`
    - Retry: `SET x A`
    - Retry: `SET x B`
    - Request: `SET x SUCCESS`
    - Retry: `SET x FAILURE`
  - Better:
    - Request: `GET x : ∅`
    - Retry: `GET x : ∅`
    - Request: `SET x SUCCESS`
    - Retry: `SET x FAILURE`
  - TODO: why do recovery points not solve this? because they depend on being able to do check-then-set atomically
- At most once (this is essentially another state machine problem)
  - Lock
  - Has operation happened?
    - No: do operation FIXME: timing issue? what if it's started but not finished because a previous attempt started then crashed?
    - Yes: don't
  - Release lock

TODO:

## Problem

- How do we prevent concurrent retries from …
- How do we reduce the amount of duplicate work?
- How do we avoid problems with atomic read-then-write?
- How do ensure guarantees without atomic check-then-set?

## Solution

TODO:
