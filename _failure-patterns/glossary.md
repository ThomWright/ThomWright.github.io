---
layout: page
title: 'Designing for failure: Glossary'
---

Key terms used across the failure patterns.

## Operation

A logical unit of work a system performs. Operations range from a single database read or write, to complex multi-step processes such as "place an order" or "register a user". An operation may consist of several sub-operations. At the application layer, a single API request typically maps to one top-level operation.

*Example: a user changing their username triggers a top-level operation which might involve reading from an auth system and writing to a database.*

See also: [Antithesis – Operation](https://antithesis.com/docs/resources/reliability_glossary/#operation)

## Process

A logical process (often an OS process) participating in a distributed system – a running service instance, a database client, a job worker, or a database node. Each process is logically single-threaded.

*Example: a payment service has three running instances; each instance is a separate process.*

See also: [Antithesis – Process](https://antithesis.com/docs/resources/reliability_glossary/#process)

## Write

An operation that changes state – for example, inserting a database row, publishing a message to a queue, or making an external API call that has side effects.

## Read

An operation that inspects state without changing it – for example, a database SELECT query.

## Side effect

An observable state change produced by a write.

*Example: charging a customer's card is a side effect of a "take payment" operation.*

## Crash

Shorthand for any fault that causes an operation to stop without completing – unexpected process termination, a network partition, a timeout, or similar.

*Example: a process crash between writing to a database and publishing a message leaves the system having completed only part of an operation.*

See also: [Antithesis – Crash](https://antithesis.com/docs/resources/reliability_glossary/#crash), [Antithesis – Network partition](https://antithesis.com/docs/resources/reliability_glossary/#network-partition)

## Definite error

An error that confirms an operation definitely did not execute. The system state is as if the operation never happened.

*Example: an aborted database transaction is a definite error – the client knows nothing was committed.*

See also: [Antithesis – Definite error](https://antithesis.com/docs/resources/reliability_glossary/#definite-error)

## Indefinite error

An error that leaves it unknown whether an operation executed, is still executing, or will execute later. This is the core challenge behind retry safety: retrying after an indefinite error risks executing the operation twice.

*Example: a network timeout is an indefinite error – the request may never have reached the server, may have been processed without acknowledgement, or may still be in-flight.*

See also: [Antithesis – Indefinite error](https://antithesis.com/docs/resources/reliability_glossary/#indefinite-error)

## Idempotency

An operation is **idempotent** if performing it multiple times has the same effect as performing it once.

There are two properties one might expect from an idempotent API:

1. **Side effects** – multiple identical requests produce no additional observable side effects beyond those of a single request.
2. **Response** – the client receives the same response every time it makes the same request.

Note: HTTP semantics for idempotent methods explicitly do not require the **Response** property.

Related: **side effect cardinality** describes how many times a side effect may occur across retries of a completed operation:

- **At most once** – the side effect happens zero or one times.
- **Exactly once** – the side effect happens exactly once.
- **At least once** – the side effect happens one or more times.
