---
layout: pattern
title: Post-operation record
short: post-operation-record
group: multiple-systems
tagline: Record current progress, and minimise more-than-once side effects
related:
  - pre-operation-record
  - store-then-reference
  - response-record
  - resumable-operation
---

## Context

Sometimes side effects by an external system cannot be produced exactly once, e.g. because the system does not use an idempotency key. Writing to the system more than once will cause repeated side effects. It can be desirable to minimise the likelihood of the effect happening more than once.

## Prerequisites

Producing the side effect at least once is acceptable.

## Example

TODO: sending an email?

## Problem

How do we ensure that a sub-operation is performed at least once (if the overall operation succeeds), but make a best effort to prevent it from being performed more than once?

## Solution

Write a record to a database after successfully performing the operation. If the record already exists, do not perform the operation. These records can be used as checkpoints in Resumable operations. A Response record is a type of Post-operation record.

## Also known as

- Checkpoint
- Recovery point

{% include related_patterns.html %}

## See also

- [Recovery points](https://brandur.org/idempotency-keys#recovery-points)
