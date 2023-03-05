---
layout: pattern
title: Transactional outbox
short: transactional-outbox
group: multiple-systems
tagline: Transactionally write a description of work to be carried out later
sort_key: 1
related:
  - atomic-transaction
---

## Context

Some requests need to write to several independent systems. Operations on independent systems may fail independently, or the system might crash in between writes, leaving the system in an inconsistent state.

## Prerequisites

Eventual consistency is acceptable. Performing the operation (or part of the operation) asynchronously is acceptable.

## Example

A new user registers with a social network. As part of registration, a database record needs to be written with the login details, and a message needs to be published so other systems can respond, e.g. by sending a welcome email or finding contact recommendations.

## Problem

How do we ensure (eventual) consistency when writing to multiple systems, even if the system crashes after only writing to a subset?

## Solution

Write one or more messages to a database in an **Atomic transaction** describing what needs to be done. A background process reads these messages and performs the operations on the other systems, retrying until they succeed.

A common approach is for the background process to publish the messages to a dedicated messaging system, e.g. RabbitMQ or AWS SNS/SQS.

## See also

- [Microservice patterns: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
