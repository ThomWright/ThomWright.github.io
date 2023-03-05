---
layout: pattern
title: Garbage collection
short: garbage-collection
group: background-processes
tagline: Find and delete unused data
---

TODO:

## Context

Some of these patterns can produce a lot of data which will never be used.

## Examples

{% assign idempotency_key = site.failure-patterns | where: 'short', 'idempotency-key' %}
{% assign post_operation_record = site.failure-patterns | where: 'short', 'recovery-point' %}
{% assign store_then_reference = site.failure-patterns | where: 'short', 'store-then-reference' %}

[Idempotency keys]({{ idempotency_key.url }}) can expire, [checkpoints]({{ recovery-point.url }}) might be redundant after operations complete, and [unreferenced data]({{ store-then-reference.url }}) can build up with enough failures.

## Problem

TODO:

## Solution

TODO:

## Alternatives

TODO: For some use cases, putting the data in a cache with a TTL can work.
