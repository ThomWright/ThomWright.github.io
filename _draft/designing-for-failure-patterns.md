---
layout: post
title: 'Designing for failure: Patterns'

# TODO:
noindex: true
---

Systems fail. Processes crash unexpectedly, network partitions happen, operations time out. How much failure is acceptable depends on context, but it’s generally important to be aware of what the implications are.

Complete failure to perform an operation is never ideal, but often less of a problem than a partial failure which could leave a system in an inconsistent state. Either way, when a client sees a failure it might retry, which can cause its own set of problems: any side effects might be executed twice (or more).

Even when there are no obvious failures, inconsistencies can arise from bugs. Systems which are large, involve concurrency, or are undergoing rapid change are particularly at risk.

In general, when designing a system we might need to consider the following:

- **Crash-safety** — What happens if the service crashes part way through handling a request?
- **Network-partition-safety** — What happens if a network partition occurs while e.g. the client is sending a request, the server is processing a request, or the server is sending a response?
- **Retry-safety** — What happens if the client sees a request fail and sends a retry?
- **Concurrency-safety** — What happens if a retry arrives while the previous request is still being processed? Or what if several different requests try to write the same data?

In this post I’m going to talk about how I think about designing systems to gracefully handle these kinds of failure cases and avoid common problems. I’ll discuss what properties we might want a system to have, and present a set of patterns for maintaining these properties, even in the presence of failures.

## Terminology

First, I’ll be using these terms a lot and I think it’s worth defining what I mean by them.

- **Operation** — A logical unit of work. Operations form a tree, and might consist of several read or write sub-operations.

    This is quite generic, so I'll often just use the term **request** instead, especially for top-level operations.
- **Write** — An operation which changes state, e.g. of a database, file system, message queue, or even the physical world.
- **Read** — An operation which inspects state but does not change it.
- **Side effect** — An observable state change caused by a write.
- **Crash** — A shorthand for various issues including unexpected process termination and network partitions which result in an operation never finishing.

A quick example: updating a username. This is a *write operation*. The system performing this operation might need to *read* from another system (to e.g. check authentication/authorisation) and then *write* the new username to a database. It would look like this, where each `|- X -|` span is an operation:

```text
Application |-- Request ---------------|
             |- Read ------||- Write -|
              v           ^
Auth system   |- Request -|
               |- Read --|
```

### Idempotency

Idempotency is often a desirable property for a system, especially when clients might be expected to retry failed requests. It’s not always clear what we mean by idempotency, so let’s look at some definitions.

The obligatory [Wikipedia definition](https://en.wikipedia.org/wiki/Idempotence):

> Idempotence is the property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.

More relevant to us is the definition from [RFC 9110: HTTP Semantics](https://httpwg.org/specs/rfc9110.html#idempotent.methods):

> A request method is considered idempotent if the intended effect on the server of multiple identical requests with that method is the same as the effect for a single such request.

Another definition I like from [Zero To Production In Rust](https://www.lpalmieri.com/posts/idempotency/#4-idempotency-an-introduction) is:

> An API endpoint is retry-safe (or **idempotent**) if the caller has no way to **observe** if a request has been sent to the server once or multiple times.

Given these, I see two properties one might expect from an idempotent API:

1. **Side effects** — Multiple identical requests do not produce any side effects beyond that of a single request.
2. **Response** — The client receives the same response every time it makes the same request.

I think 1 is what most people mean most of the time, but I often see 2 being expected as well. HTTP semantics do not require 2, and it would be strange if they did. A GET request which always returned the same response would not be very useful if the underlying resource changes.

For the most part I'll be using definition 1 (side effects), with perhaps some variation in certain cases, e.g. partially failed operations where we might want retries to produce any remaining side effects.

## Constraints

Before starting a design it’s worth taking some time to identify what [invariants](https://en.wikipedia.org/wiki/Invariant_(mathematics)#Invariants_in_computer_science) we want our system to have, and also what it is capable of: its constraints. In other words: what it *must* and *must not* do, and also what it *can* and *cannot* do.

For example, imagine a scenario where we need to write some data to two systems, and it is required that either both are written to once or neither. The operation *cannot* guarantee it'll successfully write to both before responding or crashing. But we might decide that it *must* eventually write to both, and *can* defer some writes until after sending a response.

We can use the following constraints to help us understand which patterns are appropriate for a given problem:

- **Idempotency (side effects)** — Is it required that retries cause no additional state changes? Even when a subset of the desired side effects failed? Is it required that a side effect happens at most once, exactly once or at least once? (See [Why can't we have exactly-once message processing?]({% post_url 2022-05-24-at-least-once-delivery %}))
- **Idempotency (response)** — Is it required that retries always receive the same response? Even when the operation failed?
- **Consistency** — Is it required that the system is always in a consistent state? Is eventual consistency acceptable? Are there acceptable inconsistent states?
- **Asynchronicity** — Is it required that all writes are done synchronously before returning a response? Can any be deferred until later?
- **Atomicity** — Is it possible to do all writes atomically? Is it possible to do some subsets atomically?
- **Client behaviour** — Are we in control of the client? Will it reliably retry until success?

For the previous example, we could say: the operation *cannot* be atomic, *must* be idempotent and eventually consistent, and *can* be asynchronous.

**TODO:** consider [safety and liveness](https://en.wikipedia.org/wiki/Safety_and_liveness_properties)?

**TODO:** consider whether rollbacks are required? Comes under the **Consistency** heading, I guess.

## Patterns

Reusable building blocks to help design reliable systems in the presence of failures.

{% include call-out.html
  type="info"
  content="These patterns are still a work in progress. Ship early and iterate, right?"
%}

### API design

Rather than internal details, these patterns describe the API as seen by clients.

{% assign api_design = site.failure-patterns | where: 'group', 'api-design' | sort: "sort_key", "last" %}
{% for pattern in api_design %}- **[{{ pattern.title }}]({{ pattern.url }})** — {{ pattern.tagline }}
{% endfor %}

### Writing to a single system

Patterns for writing to a single system. Most patterns assume this system is an ACID database.

{% assign single_system = site.failure-patterns | where: 'group', 'single-system' | sort: "sort_key", "last" %}
{% for pattern in single_system %}- **[{{ pattern.title }}]({{ pattern.url }})** — {{ pattern.tagline }}
{% endfor %}

### Writing to multiple systems

When writing to a single ACID database, we get atomicity and consistency built in. Things get more complicated when writing to multiple systems where we don’t have these guarantees: we might not be able to perform all writes atomically, and so can end up in an inconsistent state.

{% assign multiple_systems = site.failure-patterns | where: 'group', 'multiple-systems' | sort: "sort_key", "last" %}
{% for pattern in multiple_systems %}- **[{{ pattern.title }}]({{ pattern.url }})** — {{ pattern.tagline }}
{% endfor %}

### Background processes

Sometimes inconsistency is unavoidable, whether by design, or simply because of a buggy implementation. Background processes can identify these inconsistencies and handle them in various ways.

{% assign background_processes = site.failure-patterns | where: 'group', 'background-processes' | sort: "sort_key", "last" %}
{% for pattern in background_processes %}- **[{{ pattern.title }}]({{ pattern.url }})** — {{ pattern.tagline }}
{% endfor %}

## Further reading

- [Pattern language](https://en.wikipedia.org/wiki/Pattern_language)
- [A pattern language for microservices](https://microservices.io/patterns/index.html)
- [Messaging Patterns](https://www.enterpriseintegrationpatterns.com/)
- [The Seven Most Classic Patterns for Distributed Transactions](https://medium.com/@dongfuye/the-seven-most-classic-solutions-for-distributed-transaction-management-3f915f331e15)
- [An In-Depth Introduction To Idempotency](https://www.lpalmieri.com/posts/idempotency/)
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys)
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency)
