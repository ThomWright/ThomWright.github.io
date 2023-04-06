---
layout: pattern
title: At-most-once guard
short: at-most-once-guard
group: multiple-systems
tagline: Write to a system at most once
related:
  - recovery-point
  - response-record
  - idempotency-key
  - atomic-read-then-write
---

## Context

Sometimes side effects by a system cannot be ensured to happen exactly once, e.g. because the system does not use an idempotency key. Writing to the system more than once might cause repeated side effects.

## Prerequisites

Producing the side effect zero times is acceptable, but more than once is not. It is not necessary to know whether the operation succeeded.

## Example

A company is using a payment system which does not implement [idempotency keys]({% link _failure-patterns/idempotency-key.md %}). The company should not try to initiate a payment more than once, because it might double charge the customer.

## Problem

How do we ensure that a side effect happens at most once?

## Solution

Write a record to a database before performing the operation. If the record already exists, do not perform the operation. The operation will either succeed or fail. Subsequent retries will see the guard record and not attempt the operation again.

An [atomic read-then-write]({% link _failure-patterns/atomic-read-then-write.md %}) should be used to write the record. In the following example, the query will only return a result if the row does not already exist.

```sql
INSERT INTO guards (idempotency_key)
  VALUES ('some-key')
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING idempotency_key;
```

{% include figure.html
  img_src="/public/assets/failure-patterns/write-guard.png"
  alt="Sequence diagram for writing a guard record"
  caption="Writing a guard record"
  size="med"
%}

This pattern can lead to uncertainty. If the guard record exists, did the operation succeed or fail? It can be helpful to combine with a [recovery point]({% link _failure-patterns/recovery-point.md %}) or a [response record]({% link _failure-patterns/response-record.md %}) to record the result, but this might not always succeed.
