---
layout: pattern
title: Resumable operation
short: resumable-operation
group: multiple-systems
tagline: Allow retries to continue from where the previous attempt failed
related:
  - transactional-outbox
  - repeatable-create
  - post-operation-record
  - store-then-reference
  - completer
---

## Context

Some requests need to write to several independent systems. Operations on independent systems may fail independently, or the system might crash in between writes, leaving the system in an inconsistent state.

## Prerequisites

It is acceptable for the system to be left in an inconsistent state indefinitely, and it is acceptable for retries to perform additional side-effects to complete the operation if it fails part way through.

## Example

Uploading a profile image to a social network. The image gets stored in a blob store, then a reference stored in a separate database. The system might crash at any point before uploading the image, before storing the reference, or before sending the response.

## Problem

How do we increase the proportion of operations which eventually succeed, even when some sub-operations fail?

## Solution

Allow the client to retry, and attempt to complete any pending operation(s). Consider using **Post-operation records** as checkpoints (or [recovery points](https://brandur.org/idempotency-keys#recovery-points)) to avoid repeating work.

## Notes

This is arguably not idempotent, because retries can cause more side-effects and return a different result. However, they should not cause the same side-effect twice, and only continue progress towards success. We can consider this a more lenient form of idempotency, where an operation can be “applied multiple times without changing the result beyond the initial *successful* application”.

## Also known as

- [Passive recovery](https://www.lpalmieri.com/posts/idempotency/#10-3-forward-recovery)
- [Recovery points](https://brandur.org/idempotency-keys#recovery-points)

## See also

- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys)
  - Especially the parts about atomic phases and recovery points.
