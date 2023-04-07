---
layout: pattern
title: Atomic read-then-write
short: atomic-read-then-write
group: single-system
tagline: Concurrently write data based on current state
sort_key: 2
related:
  - acid-transaction
  - idempotency-key
  - idempotency-key-lock
---

## Context

Some write operations depend on the result of a previous read. Concurrent requests might cause the write to fail or update state incorrectly. Atomic transactions aren’t always enough to prevent these issues (depending on the [isolation level]({% post_url 2022-01-11-postgres-isolation-levels %})).

## Examples

**Creating a post in a social network.** A new post should only be created once. Retries should succeed but not create duplicate posts. Imagine two concurrent requests try to create the post. First, both reads might see no post already exists. Then there are two possible error cases: both writes succeed and two posts are created, or one write fails with a uniqueness error.

**An app which aggregates a user’s bank account data.** When refreshing the account data, each account should be updated if it already exists in the database, otherwise a new row should be inserted. Concurrent refreshes could cause the same problem as above.

**Debiting an account balance.** This needs to read the current balance, add the amount being debited, then write the result. Concurrent requests could cause a [lost update](https://begriffs.com/posts/2017-08-01-practical-guide-sql-isolation.html#lost-update), resulting in one of the debits being overwritten and money being lost.

**Optimistic concurrency.** Each row in a table has an integer `version` column, which gets incremented on every update. Clients fetch a version, say 1, make some changes then try to write a new version, 2 in this case. Clients send the current version (1) along with the update request. The application checks that this version matches the version in the database. If they don't match, the update should be rejected. Race conditions can occur, as illustrated below.

{% include figure.html
  img_src="/public/assets/failure-patterns/optimistic-conc-race.png"
  caption="Optimistic concurrency: race condition. Both requests read `x`, see version 1, and write version 2. The second overwrites the first."
  size="med"
%}

## Problem

How do we prevent problems caused by concurrent read-then-writes?

## Solution

Do the read-then-write operation [atomically](https://en.wikipedia.org/wiki/Linearizability). There are various techniques available, including:

1. **Using atomic ([linear](https://en.wikipedia.org/wiki/Linearizability)) database operations**, such as the following for PostgreSQL. Check your database documentation for equivalents and atomicity guarantees.
    1. `ON CONFLICT DO NOTHING` for unique atomic inserts and `ON CONFLICT DO UPDATE` for atomic upserts. Use a unique ID associated with the request. This could be a client-supplied ID for the resource, but often this isn’t desirable so an [idempotency key]({% link _failure-patterns/idempotency-key.md %}) could be used instead. Insert this ID into a unique column in the same table as the resource data. No duplicate records will be created, and the operation will succeed when retried.
    2. `UPDATE table SET balance = balance + $1` for atomic updates based on current state.
2. **Using locks** to prevent concurrent operations on the same data. There are many forms of locking, including `SELECT FOR UPDATE` in SQL to lock a row for later updating. More coarse-grained locks can also be used, e.g. an [idempotency key lock]({% link _failure-patterns/idempotency-key-lock.md %}) around the whole operation.
3. **Using strict [transaction isolation levels](https://en.wikipedia.org/wiki/Isolation_(database_systems)#Isolation_levels)** to prevent [phenomena](https://begriffs.com/posts/2017-08-01-practical-guide-sql-isolation.html#the-zoo-of-transaction-phenomena) such as the lost update described above. However, be aware that some levels might also cause increased transaction failures.

{% include figure.html
  img_src="/public/assets/failure-patterns/optimistic-conc-fix.png"
  caption="Optimistic concurrency: fixed using atomic read-then-write operations."
  size="med"
%}

Read-then-write isn’t the only problematic access pattern to watch out for. See [The Zoo of Transaction Phenomena](https://begriffs.com/posts/2017-08-01-practical-guide-sql-isolation.html#the-zoo-of-transaction-phenomena) for more.

## See also

- [Atomicity (database systems)](https://en.wikipedia.org/wiki/Atomicity_(database_systems))
- [Isolation (database systems)](https://en.wikipedia.org/wiki/Isolation_(database_systems))
- [Linearizability](https://en.wikipedia.org/wiki/Linearizability)
- [Consistency Models](https://jepsen.io/consistency)
- [Practical Guide to SQL Transaction Isolation](https://begriffs.com/posts/2017-08-01-practical-guide-sql-isolation.html)
- [Transaction isolation in PostgreSQL]({% post_url 2022-01-11-postgres-isolation-levels %})
- [PostgreSQL anti-patterns: read-modify-write cycles](https://www.2ndquadrant.com/en/blog/postgresql-anti-patterns-read-modify-write-cycles/)
- [The Zoo of Transaction Phenomena](https://begriffs.com/posts/2017-08-01-practical-guide-sql-isolation.html#the-zoo-of-transaction-phenomena)
