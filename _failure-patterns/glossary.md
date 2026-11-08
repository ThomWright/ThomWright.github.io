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

Shorthand for any fault that causes an operation to stop without completing – unexpected process termination, a [network partition](#network-partition), a timeout, or similar.

*Example: a process crash between writing to a database and publishing a message leaves the system having completed only part of an operation.*

See also: [Antithesis – Crash](https://antithesis.com/docs/resources/reliability_glossary/#crash)

## Network partition

A break in communication between parts of a distributed system, where messages between some nodes are lost or indefinitely delayed. Partitions may be one-directional or total, and temporary or permanent.

*Example: a network partition between a service and its database means the service can no longer read or write, even though both are individually running.*

See also: [Antithesis – Network partition](https://antithesis.com/docs/resources/reliability_glossary/#network-partition)

## Consistency

The property that data satisfies its invariants, e.g.:

- Every user has a unique email address.
- An account balance never goes negative.
- Every order in the `orders` service has a stock reservation in the `inventory` service.

This is the C in ACID. A database can enforce some invariants itself, using unique, check or foreign key constraints. No single database can enforce invariants spanning several systems, like the last one, so the application has to maintain those.

> Consistency is also an overloaded word in data systems: consistency in the sense of ACID is a very different property from consistency in CAP
>
> – Martin Kleppmann, [A Critique of the CAP Theorem](https://arxiv.org/abs/1509.05393)

In CAP, and in distributed systems generally, "consistency" refers to [consistency models](#consistency-model).

## Consistency model

A guarantee about which values reads can return, given the writes before them and those happening at the same time, usually when data is replicated. Models vary in strength, e.g. linearizability, sequential consistency, causal consistency and [eventual consistency](#eventual-consistency).

Transaction [isolation](#isolation) levels, such as serializability, are closely related. They describe transactions that read and write several objects, usually in a single copy of the data.

Stronger models allow fewer surprising outcomes. That makes systems easier to reason about, but usually slower or less available.

See also: [A Critique of the CAP Theorem](https://arxiv.org/abs/1509.05393), [Antithesis – Consistency model](https://antithesis.com/docs/resources/reliability_glossary/#consistency-model), [Jepsen – Consistency models](https://jepsen.io/consistency)

## Eventual consistency

A [consistency model](#consistency-model) in which, once no new writes are being made, all replicas eventually converge to the same value. Until then, reads may return stale data.

*Example: after a user updates their profile picture, some servers may briefly serve the old image until the change propagates.*

These patterns also use the term more loosely, for invariants spanning several systems that hold eventually rather than immediately.

*Example: an order is saved in the `orders` service, and stock is reserved in the `inventory` service asynchronously. Until the reservation is made, the order has no stock reserved.*

See also: [Antithesis – Eventual consistency](https://antithesis.com/docs/resources/reliability_glossary/#eventual-consistency)

## Isolation

The property that concurrent [operations](#operation) don't interfere with each other: the result is the same as if they had run one at a time.

*Example: two operations each debit £10 from a £50 balance. With isolation, the balance ends at £30. Without it, both might read £50 and then both write £40, losing one debit.*

This is the I in ACID. Full isolation (serializability) is costly, so databases offer weaker *isolation levels*, which allow some anomalies, such as lost updates or [fractured reads](#fractured-read). The default level is often weaker than people expect, e.g. `READ COMMITTED` in PostgreSQL. Isolation levels are closely related to [consistency models](#consistency-model).

A database only isolates its own transactions. Operations spanning several systems get no isolation from each other unless something coordinates them.

See also: [Wikipedia – Isolation](https://en.wikipedia.org/wiki/Isolation_(database_systems)), [Transaction isolation in PostgreSQL]({% post_url 2022-01-11-postgres-isolation-levels %})

## Fractured read

A read that sees some of another operation's writes, but not the rest.

*Examples:*

- *A transfer moves £10 from account A to account B in one transaction. A report reads A's balance, then B's, in separate queries, with the transfer committing in between. It sees A before the transfer and B after, so £10 appears from nowhere.*
- *During a distributed transaction, a read sees a new order in the `orders` service, but not its stock reservation in the `inventory` service.*

The guarantee that prevents fractured reads is *atomic visibility*: either all of an operation's writes are visible, or none are.

See also: [Antithesis – Fractured read](https://antithesis.com/docs/resources/reliability_glossary/#fractured-read), [Scalable Atomic Visibility with RAMP Transactions](https://www.bailis.org/blog/scalable-atomic-visibility-with-ramp-transactions/)

## Safety and liveness

Two fundamental properties used to reason about distributed systems:

- **Safety** – nothing bad ever happens. A safety property is an invariant that must hold at all times. Violations are permanent: once a safety property is broken, it cannot be undone.
- **Liveness** – something good eventually happens. A liveness property guarantees that the system will eventually make progress.

These properties often trade off against each other. A system that never acts is perfectly safe but has no liveness. A system that always acts immediately may have good liveness but risk safety violations.

*Example: the [at-most-once guard]({% link _failure-patterns/at-most-once-guard.md %}) trades liveness for safety – it guarantees a side effect won't happen more than once (safety), but if the operation fails after the guard is written, it will never be retried (no liveness).*

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
