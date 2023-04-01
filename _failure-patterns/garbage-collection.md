---
layout: pattern
title: Garbage collection
short: garbage-collection
group: background-processes
tagline: Find and delete unused data
incomplete: true
---

TODO:

## Context

Some of these patterns can produce a lot of data which will never be used.

## Examples

[Idempotency keys]({% link _failure-patterns/idempotency-key.md %}) can expire, [recovery points]({% link _failure-patterns/recovery-point.md %}) might be redundant after operations complete, and [unreferenced data]({% link _failure-patterns/store-then-reference.md %}) can build up with enough failures.

## Problem

TODO:

How do we prevent the indefinite storage of unused data? (naah)

How do we dispose of unnecessary data? (no good: suggests a solution)

## Solution

TODO:

Run period garbage collection.

- identify which records are no longer needed
- delete them
- consider batching, or performing frequently enough that the operation doesn't overload the database

## Alternatives

TODO: For some use cases, putting the data in a cache with a TTL can work.
