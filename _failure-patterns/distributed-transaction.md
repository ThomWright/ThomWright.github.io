---
layout: pattern
title: Distributed transaction
short: distributed-transaction
group: multiple-systems
description: Write to multiple systems transactionally
sort_key: 3
related:
  - acid-transaction
  - saga
---

## Context

Some operations need to synchronously write to two or more transactional systems.

## Prerequisites

Every system supports *preparing* a transaction: making it ready to commit, then waiting for an instruction to commit or roll back. For example, PostgreSQL's [`PREPARE TRANSACTION`](https://www.postgresql.org/docs/current/sql-prepare-transaction.html), or MySQL's [XA transactions](https://dev.mysql.com/doc/refman/8.4/en/xa.html).

[Eventual consistency]({% link _failure-patterns/glossary.md %}#eventual-consistency) is acceptable. So is reduced availability: every system must be available for a transaction to commit, and if the process coordinating the transaction fails partway through, transactions can be left holding locks until it recovers, blocking other operations.

Significant extra complexity is acceptable.

## Example

An e-commerce application stores orders and stock in separate databases, `orders` and `inventory`. When an order is placed, it needs to be recorded in `orders`, and some stock needs to be reserved in `inventory`.

## Problem

How do we perform a transaction across more than one system, such that either all writes get committed or none of them do?

## Solution

Coordinate the transaction using the [two-phase commit](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) protocol (2PC).

2PC has two roles: a single *coordinator*, and several *participants*, each storing some data. In the example, the application is the coordinator, and the `orders` and `inventory` databases are the participants.

1. **Prepare** – The *coordinator* asks each *participant* to prepare its transaction: do all the work, up to but not including committing. Each *participant* replies saying whether it can commit.

2. **Commit** – If every *participant* can commit, the *coordinator* tells them all to commit. Otherwise, it tells them all to roll back.

### Handling failures

Once the *coordinator* has decided to commit or roll back, the decision is final. It must keep sending it to every *participant*, retrying through failures until each one acknowledges, much like [reliable retries]({% link _failure-patterns/reliable-retries.md %}). Repeated instructions must be safe. For example, committing a transaction that has already committed should count as success.

{% include callout.html
  type="aside"
  content="In PostgreSQL, repeating `COMMIT PREPARED` fails, because the prepared transaction no longer exists. The *coordinator* needs to treat this error as success."
%}

To survive [crashes]({% link _failure-patterns/glossary.md %}#crash), each role must record what it's doing before acting on it:

- A *participant* must durably store its prepared transaction, including its locks, before replying that it can commit. After a crash, it restores the transaction and keeps holding the locks.
- The *coordinator* must durably record its decision, e.g. in a [write-ahead log](https://en.wikipedia.org/wiki/Write-ahead_logging), before telling any *participant* to commit. After a crash, it reads the log and carries on sending the decision. If it crashed before recording a decision, it rolls back.

A *participant* that has prepared can't decide on its own. Rolling back might contradict a commit the *coordinator* has already sent to others, and committing might contradict a rollback. So while the *coordinator* is unavailable, prepared transactions wait, holding their locks and blocking other operations that need them.

### Fractured reads

2PC makes the writes atomic, but not fully [isolated]({% link _failure-patterns/glossary.md %}#isolation). Each *participant* only isolates its own transaction, and they don't all commit at the same instant. In the example, `orders` might commit before `inventory`. In between, another operation could see the order but not its stock reservation: a [fractured read]({% link _failure-patterns/glossary.md %}#fractured-read). This usually lasts only as long as the commit phase, but if the commit can't reach a *participant*, e.g. because of a [network partition]({% link _failure-patterns/glossary.md %}#network-partition) or a crash, it lasts until it does.

Preventing this means readers have to take part in the locking too. They lock everything they read, in every *participant*, and hold the locks until they've finished reading. This is slow and can deadlock across systems. It also doesn't cover rows that don't exist yet, such as a new order. Often it's simpler to accept the inconsistency.

## Alternatives

For longer-running transactions, or systems that don't support preparing transactions, consider using a [saga]({% link _failure-patterns/saga.md %}).

Also, consider whether it would be possible to consolidate your data into a single system to make [atomic transactions]({% link _failure-patterns/acid-transaction.md %}) possible. This will likely result in a much simpler system. If the data doesn't fit in one database, a distributed database (e.g. [CockroachDB](https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer), [Spanner](https://cloud.google.com/spanner/docs/transactions)) runs distributed transactions internally, so the application doesn't have to coordinate them. At serializable isolation, the default in both, they also prevent [fractured reads]({% link _failure-patterns/glossary.md %}#fractured-read).

## See also

- [Wikipedia: Distributed transaction](https://en.wikipedia.org/wiki/Distributed_transaction)
- [Wikipedia: Two-phase commit protocol](https://en.wikipedia.org/wiki/Two-phase_commit_protocol)
- [The Seven Most Classic Patterns for Distributed Transactions](https://medium.com/@dongfuye/the-seven-most-classic-solutions-for-distributed-transaction-management-3f915f331e15)
- [Patterns for distributed transactions within a microservices architecture](https://developers.redhat.com/blog/2018/10/01/patterns-for-distributed-transactions-within-a-microservices-architecture)
