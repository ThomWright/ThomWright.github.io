---
layout: pattern
title: Store-then-reference
short: store-then-reference
group: multiple-systems
tagline: Prevent dangling references
related:
  - recovery-point
  - garbage-collection
  - resumable-operation
---

## Context

Some operations need to write data to an external system, and write a reference to that data in another system (often a local database). Referencing data that does not exist is likely to be an invalid system state.

## Prerequisites

It is acceptable to end up with “garbage” un-referenced data. The data should not be accessed without a reference.

## Examples

Uploading a profile image on a social network.

## Problem

How do we prevent dangling references if writing the data fails?

## Solution

First store the data, then store the reference. Any updates to this data should be written separately, rather than overwriting the original, in an [append-only](https://en.wikipedia.org/wiki/Append-only) manner.

This can be thought of similarly to [Multiversion Concurrency Control (MVCC)](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) in databases.

This operation is naturally [resumable](../resumable-operation). [Garbage collection](../garbage-collection) can be used to clean up stale, unreferenced data.

## See also

- [Pragmatic Formal Modelling: Coordinating a Database and Blob Store](https://elliotswart.github.io/pragmaticformalmodeling/database-blob/)
