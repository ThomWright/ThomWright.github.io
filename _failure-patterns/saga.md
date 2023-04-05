---
layout: pattern
title: Saga
short: saga
group: multiple-systems
tagline: Perform a series of transactions with backwards recovery
related:
  - atomic-transaction
  - distributed-transaction
  - transactional-outbox
  - completer
  - resumable-operation
  - recovery-point
---

## Context

Some operations need to write to two or more transactional systems, and require the end result to be a complete success or complete failure. The operation terminating in a partial success state (having successfully written to only a subset of systems) is not acceptable, though this is an acceptable intermediate state.

## Prerequisites

Eventual consistency is acceptable.

It is worth introducing extra complexity.

## Example

A travel booking system needs to book a hotel and a flight. It must either book both, or neither.

## Problem

How do we perform multiple operations such that either they all (eventually) either succeed or get rolled back?

## Solution

Use a saga. Sagas are a sequence of transactions, and introduce the idea of **backwards recovery** to [resumable operations]({% link _failure-patterns/resumable-operation.md %}) and [recovery points]({% link _failure-patterns/recovery-point.md %}).

Model your operation as a set of states and transitions between those states. There will be a set of acceptable terminal states (including the initial state), and intermediate states. It must be possible to transition from any intermediate state to a terminal state. If forward progress is not possible, it should be possible to transition backwards to the initial state.

These backwards transitions are known as **compensating actions**, and are effectively a rollback mechanism.

For the travel booking example, we might have three states:

1. Nothing booked (initial state, terminal state) - `∅`
2. Flight booked (intermediate state) - `FB`
3. Flight and hotel booked (terminal state) - `FB HB`

And two forward operations: `book flight` and `book hotel`. If we end up in a state where we've booked the flight but cannot book the hotel (e.g. because it is full), then we need the backward operation: `cancel flight`.

{% include figure.html
  img_src="/public/assets/failure-patterns/saga.png"
  alt="State diagram for the travel booking example"
  caption="A saga with three states, two forward transitions and a backwards transition (compensating action). Acceptable terminal states in green."
  size="med"
%}

You will want some way to drive progress (either forwards or backwards). This can be a centralised system, such as a [completer]({% link _failure-patterns/completer.md %}) (known as *orchestration*), or distributed using e.g. [transactional outboxes]({% link _failure-patterns/transactional-outbox.md %}) (known as *choreography*).

## See also

- [Microservice patterns: Saga](https://microservices.io/patterns/data/saga.html)
- [[Video] What is a Saga in Microservices?](https://www.youtube.com/watch?v=0W8BtIwh824)
- [Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
