---
layout: pattern
title: Garbage collection
short: garbage-collection
group: background-processes
tagline: Find and delete unused data
---

## Context

Some of these patterns can produce a lot of garbage data which will never be used.

## Examples

[Idempotency keys]({% link _failure-patterns/idempotency-key.md %}) can expire, [recovery points]({% link _failure-patterns/recovery-point.md %}) might be redundant after operations complete, and [unreferenced data]({% link _failure-patterns/store-then-reference.md %}) can build up with enough failures.

## Problem

How do we limit the amount of garbage data stored?

## Solution

Run a periodic garbage collection process. The process can be scheduled to run as a cron job. It will need to:

1. Identify which records are no longer needed.
2. Delete these records.

It can be worth considering performing this process in fixed-size batches so the operation doesn't overload the database, and running frequently enough that the amount of garbage doesn't grow faster than it can be collected.

## Alternatives

In some cases it is possible to put the data in a cache with a TTL. If the data is intended to be temporary then this can work well.
