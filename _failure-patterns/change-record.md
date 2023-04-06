---
layout: pattern
title: Change record
short: change-record
group: single-system
tagline: Record that a change has been made so it doesn't happen again
related:
  - acid-transaction
  - idempotency-key
---

## Context

Some database operations are not (always) naturally idempotent. If they are performed more than once, the state will change again and the result will be different.

## Examples

- Incrementing an integer is not naturally idempotent.
- Deleting a record by ID is sometimes naturally idempotent, but not when a new record is created with the same ID after the original request and before a retried request.

## Problem

How do we prevent retries from updating state more than once?

## Solution

Ensure there is a unique value that is consistent across retries (e.g. an idempotency key). Do the database operation inside a transaction. In this transaction, as well as the intended operation, insert a change record with this unique value in a unique column. If the operation has already been performed, the operation will fail with the uniqueness check, ensuring it only happens once.

This can be done even when the operation has no effect on the current state, e.g. deleting a record which does not exist. This is especially relevant where state changes are already being recorded for e.g. auditing purposes. It can be easy to forget to record when a state change is attempted but no state actually changes.
