---
layout: pattern
title: Garbage collection
short: garbage-collection
group: background-processes
description: Find and delete unused data
related:
  - idempotency-key
  - recovery-point
  - store-then-reference
---

## Context

Some of these patterns can produce a lot of garbage data which will never be used.

## Examples

[Idempotency keys]({% link _failure-patterns/idempotency-key.md %}) can expire, [recovery points]({% link _failure-patterns/recovery-point.md %}) might be redundant after operations complete, and [unreferenced data]({% link _failure-patterns/store-then-reference.md %}) can build up with enough failures.

## Problem

How do we limit the amount of garbage data stored?

## Solution

Run a periodic garbage collection process. The process can be scheduled to run as a cron job. It will need to:

1. Identify which records are no longer needed. Be careful not to include records which an in-progress operation still needs. For example, newly stored data which isn't referenced *yet* can look the same as garbage. One approach is to only delete records older than a grace period. There's often no natural upper bound on how long an operation can take, so this is a trade-off: how likely an operation is to outlive the grace period, against the impact if its data is deleted. Giving operations a deadline, after which they are abandoned, can reduce the risk further, but isn't a guarantee.
2. Delete these records.

It can be worth considering performing this process in fixed-size batches so the operation doesn't overload the database, and running frequently enough that the amount of garbage doesn't grow faster than it can be collected.

## Alternatives

In some cases it is possible to put the data in a cache with a TTL. If the data is intended to be temporary then this can work well.

## See also

- [AWS: Summary of the Amazon DynamoDB Service Disruption](https://aws.amazon.com/message/101925/) – a clean-up process deleted an old DNS plan which a delayed process had just applied, leaving DynamoDB's regional endpoint in us-east-1 with no IP addresses
