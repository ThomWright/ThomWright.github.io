---
layout: pattern
title: Transactional outbox
short: transactional-outbox
group: multiple-systems
tagline: Transactionally write a description of work to be performed asynchronously
sort_key: 1
related:
  - acid-transaction
  - callback
  - reliable-retries
---

## Context

Some requests need to write to several independent systems. Write operations on these systems might fail independently, or the application might crash in between writes, leaving the system in an inconsistent state.

## Prerequisites

Eventual consistency is acceptable. Performing the operation (or part of the operation) asynchronously is acceptable.

## Example

A new user registers with a social network. As part of registration, a database record needs to be written with the login details, and an event needs to be published so other systems can respond, e.g. by sending a welcome email or finding contact recommendations. Imagine either of the following scenarios:

1. **Publishing fails** - The application writes the new user record to the database. It then tries to publish the event, but fails with a transient error.
2. **The application crashes** - The application writes the new user record to the database. It then crashes before publishing the event.

Either of these will result in no welcome email being sent, and no other system being aware of the newly registered user.

## Problem

How do we ensure (eventual) consistency when writing to multiple systems?

## Solution

Write one or more messages to a database in an [Atomic transaction]({% link _failure-patterns/acid-transaction.md %}) describing what needs to be done. A background process reads these messages and performs the work on the other systems, retrying until it succeeds.

Essentially, instead of trying to synchronously write to many systems, we instead write to just one system atomically, allowing other writes to happen asynchronously.

 A common approach is for the background process to publish the messages to a dedicated messaging system, e.g. RabbitMQ or AWS SNS/SQS. This could be an external process or internal to the application.

<!-- markdownlint-disable MD033 -->
<figure class="multi-img">
  <img class="small-img" src="/public/assets/failure-patterns/outbox-ext-pub.png" alt="Outbox with an external publisher process"/>
  <img class="small-img" src="/public/assets/failure-patterns/outbox-int-pub.png" alt="Outbox with an internal publisher"/>
  <figcaption>An external publisher process and an internal publisher.</figcaption>
</figure>

There are several ways to trigger the publisher:

1. On a schedule, by running as a cron job or a process [polling](https://microservices.io/patterns/data/transaction-log-tailing.html) the database. This introduces some latency.
2. By explicitly notifying it when a new message is ready. Simple if the publisher runs in the same process as the application itself.
3. By [tailing the transaction log](https://microservices.io/patterns/data/transaction-log-tailing.html). Arguaby  more complex.

Can be paired with [Callbacks]({% link _failure-patterns/callback.md %}) to notify clients of the result (e.g. success/failure) on completion.

## See also

- [Microservice patterns: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
