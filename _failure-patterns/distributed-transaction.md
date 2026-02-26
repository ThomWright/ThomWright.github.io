---
layout: pattern
title: Distributed transaction
short: distributed-transaction
group: multiple-systems
tagline: Write to multiple systems transactionally
sort_key: 3
related:
  - acid-transaction
  - saga
---

## Context

Some operations need to synchronously write to two or more transactional systems.

## Prerequisites

Eventual consistency, blocking and the possibility of data loss is acceptable.

It is worth introducing significant complexity.

## Example

An e-commerce platform has two services: `orders` and `inventory`. When an order is placed it needs to be recorded in the `orders` service and some stock needs to be reserved in the `inventory` service.

## Problem

How do we perform a transaction across more than one system, such that either all writes get committed or none of them do?

## Solution

Use a distributed transaction by implementing e.g. the [two-phase](https://en.wikipedia.org/wiki/Two-phase_commit_protocol) or [three-phase](https://en.wikipedia.org/wiki/Three-phase_commit_protocol) commit protocols.

{% include callout.html
  type="warning"
  content="It is worth carefully reading the assumptions and drawbacks for these protocols to decide whether they are appropriate for your use case."
%}

Two-phase commit has two types of participant:

1. A single *coordinator*
2. Several *participants*, each storing some data

The basic algorithm is (for the success case):

1. **Prepare** – The *coordinator* sends requests to each *participant* to execute their own transaction, up to but not including committing.

    Each *participant* replies saying that they can successfully commit the transaction.

2. **Commit** – After receiving successful responses from all *participants*, the *coordinator* sends requests to all *participants* to commit.

There is significant complexity in implementing robust distributed transactions. It is worth considering the following scenarios:

- What if the *coordinator* crashes part way through the commit phase?
- What if a *participant* crashes after the prepare phase and before committing?

To ensure (eventual) atomicity, to solve the first case the *coordinator* must have a crash-recovery mechanism, e.g. a [Write-Ahead Log (WAL)](https://en.wikipedia.org/wiki/Write-ahead_logging), and use it to continue in any in-progress transactions after a crash. To solve the second case, participants must persist their uncommitted changes. Any pending transactions (uncommitted changes and associated locks) must continue to be held after recovering from a crash.

## Alternatives

For longer-running transactions, consider using a [saga]({% link _failure-patterns/saga.md %}).

Also, consider whether it would be possible to consolidate your data into a single system to make [atomic transactions]({% link _failure-patterns/acid-transaction.md %}) possible. This will likely result in a much simpler system.

## See also

- [Wikipedia: Distributed transaction](https://en.wikipedia.org/wiki/Distributed_transaction)
- [Wikipedia: Two-phase commit protocol](https://en.wikipedia.org/wiki/Two-phase_commit_protocol)
- [Wikipedia: Three-phase commit protocol](https://en.wikipedia.org/wiki/Three-phase_commit_protocol)
- [The Seven Most Classic Patterns for Distributed Transactions](https://medium.com/@dongfuye/the-seven-most-classic-solutions-for-distributed-transaction-management-3f915f331e15)
- [Patterns for distributed transactions within a microservices architecture](https://developers.redhat.com/blog/2018/10/01/patterns-for-distributed-transactions-within-a-microservices-architecture)
