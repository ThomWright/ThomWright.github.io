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

Some operations involve calling an external system which produces side effects. Ideally the external system supports [idempotency keys]({% link _failure-patterns/idempotency-key.md %}), allowing the call to be safely retried. When it does not, we need to decide what to do when the outcome of a call is unknown -- for example due to a network timeout or a crash.

Sometimes it's possible to check by reading from the external system (e.g. a GET request), but a suitable read API might not exist, or the external system might be eventually consistent, making the result unreliable.

Without a reliable way to determine the outcome, retrying the call risks producing the side effect again.

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

This pattern trades **liveness** for **safety**: it guarantees the operation won't happen more than once, but if the operation fails, it will never be retried.

This can lead to uncertainty. If the guard record exists but the outcome is unknown -- for example because of a network timeout -- did the operation succeed or fail? If knowing the outcome is important, consider recording it alongside the guard record when available, but be aware that if the failure occurs before the outcome can be recorded, the uncertainty remains.
