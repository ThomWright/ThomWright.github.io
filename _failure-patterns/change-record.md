---
layout: pattern
title: Change record
short: change-record
group: single-system
description: Record that a change has been made so it doesn't happen again
related:
  - acid-transaction
  - idempotency-key
  - reject-duplicate
---

## Context

Some database operations are not (always) naturally idempotent. If they are performed more than once, the state will change again and the result will be different.

## Examples

- Crediting a user's account £10 for a referral bonus. Without a change record, a retried request would credit £10 twice.
- Incrementing an integer is not naturally idempotent.
- Deleting a record by ID is sometimes naturally idempotent, but not when a new record is created with the same ID after the original request and before a retried request.

## Problem

How do we prevent retries from updating state more than once?

## Solution

Ensure there is a unique value that is consistent across retries, e.g. an [idempotency key]({% link _failure-patterns/idempotency-key.md %}), or a value from the domain such as the referral ID. Do the database operation inside a transaction. In this transaction, first insert a change record with this unique value in a unique column, using e.g. `INSERT … ON CONFLICT DO NOTHING`. If no row was inserted, the operation has already been performed: skip it and return success, rather than [rejecting the duplicate]({% link _failure-patterns/reject-duplicate.md %}). Otherwise, perform the intended operation.

This can be done even when the operation has no effect on the current state, e.g. deleting a record which does not exist. This is especially relevant where state changes are already being recorded for e.g. auditing purposes. It can be easy to forget to record when a state change is attempted but no state actually changes.
