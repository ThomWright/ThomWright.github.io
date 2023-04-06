---
layout: pattern
title: ACID transaction
short: acid-transaction
redirect_from:
  - /failure-patterns/atomic-transaction
group: single-system
tagline: Perform multiple writes, such that either all of them or none of them succeed
sort_key: 1
---

## Context

Many operations perform multiple writes on a single database, all of which must be applied (or none of them) to ensure consistency. These writes should not be observable in an inconsistent state, and should not be lost as a result of a crash.

## Example

A customer places an order to purchase multiple items. The server needs to store details about the order and reduce stock counts for each item. If the server crashes part way through, stock counts for some items could be reduced but not others.

## Problem

How do we ensure the system does not get left in an inconsistent state when the system crashes after applying a subset of writes?

## Solution

Perform all writes inside a transaction in an ACID database. Either all writes will succeed or none of them will. The transaction will be atomic and isolated, so no other transactions will see inconsistent states (depending on the [isolation level]({% post_url 2022-01-11-postgres-isolation-levels %})).

## See also

- [Wikipedia: ACID](https://en.wikipedia.org/wiki/ACID)
- [PostgreSQL: Transactions](https://www.postgresql.org/docs/15/tutorial-transactions.html)
- [Amazon DynamoDB Transactions: How it works](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)
- [Transaction isolation levels](https://en.wikipedia.org/wiki/Isolation_(database_systems)#Isolation_levels)
- [PostgreSQL isolation levels]({% post_url 2022-01-11-postgres-isolation-levels %})
- [Atomic phases](https://brandur.org/idempotency-keys#atomic-phases)
