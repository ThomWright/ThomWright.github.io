---
layout: pattern
title: Recovery point
short: recovery-point
group: multiple-systems
tagline: Record current progress to allow recovery with minimal rework
related:
  - pre-operation-record
  - store-then-reference
  - response-record
  - resumable-operation
---

## Context

When implementing a [Resumable operation](../resumable-operation), it can be desirable to minimise rework, either because the operations are expensive or might produce repeated side effects. In which case we would want to perform each sub-operation at least once, while minimising the frequency of any happening more than once.

## Prerequisites

It is acceptable to perform each sub-operation at least once, and for retries to perform additional side-effects after a previous attempt fails.

## Example

TODO: sending an email?

## Problem

How do we ensure that a sub-operation is performed at least once (if the overall operation succeeds), but make a best effort to prevent it from being performed more than once?

## Solution

Write a record to a database after successfully performing a part of the operation, identifying the completed operation, and included any necessary data needed for the next steps. Associate the record with the idempotency key.

When handling a request, start by fetching the latest recovery point associated with the idempotency key, and continue from that point.

A [Response record](../response-record) is a special type of Recovery point.

## Also known as

- Checkpoint
- [Passive recovery](https://www.lpalmieri.com/posts/idempotency/#10-3-forward-recovery)
- Post-operation record

## See also

- [Recovery points](https://brandur.org/idempotency-keys#recovery-points)
