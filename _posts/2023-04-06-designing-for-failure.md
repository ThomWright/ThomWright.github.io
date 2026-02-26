---
layout: post
title: 'Designing for failure: Introduction'
tags: [reliability, microservices]
toc: true
redirect_from:
  - /draft/designing-for-failure-patterns
---

Systems fail. Processes crash unexpectedly, network partitions happen, operations time out. How much failure is acceptable depends on context, but it’s generally important to be aware of what the implications are.

Complete failure to perform an operation is never ideal, but often less of a problem than a partial failure which could leave a system in an inconsistent state. Either way, when a client sees a failure it might retry, which can cause its own set of problems: any side effects might be executed twice (or more).

Even when there are no obvious failures, inconsistencies can arise from bugs. Systems which are large, involve concurrency, or are undergoing rapid change are particularly at risk.

In general, when designing a system we might need to consider the following:

- **Crash-safety**&nbsp;– What happens if a process crashes part way through handling a request?
- **Network-partition-safety**&nbsp;– What happens if a network partition occurs while e.g. the client is sending a request, the server is processing a request, or the server is sending a response?
- **Retry-safety**&nbsp;– What happens if the client sees a request fail and sends a retry?
- **Concurrency-safety**&nbsp;– What happens if a retry arrives while the previous request is still being processed? Or what if several different requests try to write the same data?

I'm developing a set of [patterns]({% link failure-patterns.md %}) for thinking about how to design microservice-style systems to gracefully handle these kinds of failure cases and avoid common problems.

This post serves as an introduction to the ideas behind the patterns.

## Terminology

First, I’ll be using these terms a lot and I think it’s worth defining what I mean by them.

System

: An independent software application. This could be e.g. a microservice, a database, or a large third party such as a bank (which itself will likely be comprised of many internal systems). Systems communicate with each other over a network.

  This is quite generic, so I'll often use the term **application** when referring to the system we're primarily focusing on.

Operation

: A logical unit of work. Operations form a tree, and might consist of several read or write sub-operations.

  An operation (e.g. register a new user) might take several attempts (e.g. retried requests) to complete.

  Despite this, I'll often just use the term **request** instead, especially for top-level operations.

Write

: An operation which changes state, e.g. of a database, file system, message queue, or even the physical world.

Read

: An operation which inspects state but does not change it.

Side effect

: An observable state change caused by a write.

Crash

: A shorthand for various issues including unexpected process termination and network partitions which result in an operation never finishing.

A quick example: updating a username. This is a *write operation*. The application performing this operation might need to *read* from another system (to e.g. check authentication and authorisation) and then *write* the new username to a database. It would look like this, where each `|- X -|` span is an operation:

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

> Idempotence is the property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.

More relevant to us is the definition from [RFC 9110: HTTP Semantics](https://httpwg.org/specs/rfc9110.html#idempotent.methods):

> A request method is considered idempotent if the intended effect on the server of multiple identical requests with that method is the same as the effect for a single such request.

Another definition I like from [Zero To Production In Rust](https://www.lpalmieri.com/posts/idempotency/#4-idempotency-an-introduction) is:

> An API endpoint is retry-safe (or **idempotent**) if the caller has no way to **observe** if a request has been sent to the server once or multiple times.

We can think of "intended effect on the server" from the HTTP specification as meaning "observable".

Given these, I see two properties one might expect from an idempotent API:

1. **Side effects**&nbsp;– Multiple identical requests do not produce any observable side effects beyond that of a single request.
2. **Response**&nbsp;– The client receives the same response every time it makes the same request.

I think **Side effects** is what most people mean most of the time, but I often see **Response** being expected as well. It's worth noting HTTP semantics for idempotent methods explicitly do not require the **Response** property. Arguably this property is more about *referential transparency*, but I'd argue this can also be an important property when designing failure-tolerant systems. If the response contains some vital information (e.g. an ID of a new resource), then it might be critical that responses to retries also contain this ID for the client system to be able to function correctly.

I'd caveat this with saying that the rules for *incomplete* operations can be a bit different if you're allowing retries to drive an operation to completion. For example, a transient failure might result in an HTTP 500 and the intended side effect *maybe* happening, it's impossible to know from the client's perspective. A subsequent retry might then ensure the side effect did happen (if it didn't already) and result in an HTTP 200. Any subsequent requests should not cause any side effects, and return the same HTTP 200 as before.

Another important and related concept is one that I don't have a name for (side effect cardinality?). It describes how many times a side effect can occur for a given *completed* operation:

- **At most once** – Multiple identical requests must result the side effect happening either zero or one times.
- **Exactly once** – Multiple identical requests must result in the side effect happening exactly once.
- **At least once** – Multiple identical requests must result in the side effect happening once or more.

This might not look like idempotency, because side effects can happen more than once. However, if the **at least once** side effects are not *externally observable* – for example publishing multiple identical messages which result in an observable **exactly once** side effect elsewhere in the system – then the idempotency property generally holds when looking at the bigger picture. In other words, the message publishing side effect does not itself have the "intended effect on the server", so doesn't count in terms of idempotency.

## Constraints

Before starting a design it’s worth taking some time to identify what [invariants](https://en.wikipedia.org/wiki/Invariant_(mathematics)#Invariants_in_computer_science) we want our system to have, and also what it is capable of: its constraints. In other words: what it *must* and *must not* do, and also what it *can* and *cannot* do.

For example, imagine a scenario where we need to write some data to two systems, and it is required that either both systems are written to or neither is. The operation *cannot* guarantee it'll successfully write to both before responding or crashing. But we might decide that it *must* eventually write to both, and *can* defer some writes until after sending a response.

We can use the following constraints to help us understand which patterns are appropriate for a given problem:

- **Idempotency (side effects)**&nbsp;– Is it required that retries cause no additional state changes? Even when a subset of the desired side effects failed? Is it required that a side effect happens at most once, exactly once or at least once? (See [Why can't we have exactly-once message processing?]({% post_url 2022-05-24-at-least-once-delivery %}))
- **Idempotency (response)**&nbsp;– Is it required that retries always receive the same response? Even when the operation failed?
- **Consistency**&nbsp;– Is it required that the system is always in a consistent state? Is eventual consistency acceptable? Are there acceptable inconsistent states?
- **Synchronicity**&nbsp;– Is it required that all writes are done before returning a response? Can any be deferred until later?
- **Atomicity**&nbsp;– Is it possible to ensure that either all writes succeed or none of them do? Is it possible to do this for some subset of writes?
- **Client behaviour**&nbsp;– Are we in control of the client? Will it reliably retry until success?

For the previous example, we could say: the operation *cannot* be atomic, *must* be idempotent and eventually consistent, and *can* be asynchronous.

## Why patterns?

There are lots of problems to solve when designing distributed applications, and many competing solutions to these problems. When faced with a particular problem, it can be difficult to remember all the options along with their pros and cons, and difficult to succinctly communicate them to others.

I find patterns helpful in this regard. I like being able to quickly read through possible solutions and narrow down the options. I often get a better understanding the problem I'm trying to solve by doing so, and sometimes realise there are other problems I hadn't considered. Being able to share links with my team and build a shared language makes designing systems together quicker and easier.

You can find all the [patterns listed here]({% link failure-patterns.md %}).

## Further reading

- [Wikipedia: ACID](https://en.wikipedia.org/wiki/ACID)
- [Wikipedia: Eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency)
- [Designing Data-Intensive Applications](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/)
- [Handling Failures From First Principles](https://dominik-tornow.medium.com/handling-failures-from-first-principles-1ed976b1b869)
