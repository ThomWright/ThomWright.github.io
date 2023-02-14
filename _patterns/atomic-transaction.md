---
layout: pattern
title: Atomic transaction
short: atomic-transaction
group: single-system
tagline: Perform multiple writes, such that either all of them or none of them succeed
---

## Context

Many operations perform multiple writes on a single database, all of which must be applied to ensure consistency. If the system crashes after applying some, but not all, writes have been applied, the system will be left in an inconsistent state.

## Example

A customer places an order to purchase multiple items. The server needs to store details about the order and reduce stock counts for each item. If the server crashes part way through, stock counts for some items could be reduced but not others.

## Problem

How do we ensure the system does not get left in an inconsistent state when the system crashes after applying a subset of writes?

## Solution

Perform all writes inside a transaction. Either all writes will succeed or none of them will.

{% include related_patterns.html %}

## See also

- [Atomicity (database systems)](https://en.wikipedia.org/wiki/Atomicity_(database_systems))
