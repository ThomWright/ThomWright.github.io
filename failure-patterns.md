---
layout: page
title: 'Designing for failure: Patterns'
short_title: 'Patterns'
catalogue: true
order: 2
---

<!-- markdownlint-disable MD022 MD033 -->

Reusable building blocks to help design reliable systems in the presence of failures.

See the [introductory post]({% post_url 2023-04-06-designing-for-failure %}) and the [glossary]({% link _failure-patterns/glossary.md %}) for definitions of terms used throughout.

{% include callout.html
  type="info"
  content="These are still a work in progress. Feedback appreciated!"
%}

## API design
{: data-group="api-design"}

Rather than internal details, these patterns describe the API as seen by clients.

{% include pattern_grid.html group="api-design" %}

## Writing to a single system
{: data-group="single-system"}

Patterns for writing to a single system. Most patterns assume this system is an ACID database. This is the simplest topology, and the easiest to work with. It's worth trying to design systems like this where possible, to avoid the complexity that arises from trying to maintain consistency between multiple systems.

{% include pattern_grid.html group="single-system" %}

## Writing to multiple systems
{: data-group="multiple-systems"}

When writing to a single ACID database, we get atomicity and consistency built in. Things get more complicated when writing to multiple systems where we don't have these guarantees: we might not be able to perform all writes atomically, and so can end up in an inconsistent state.

{% include pattern_grid.html group="multiple-systems" %}

## Background processes
{: data-group="background-processes"}

Sometimes inconsistency is unavoidable, whether by design, or simply because of a buggy implementation. Background processes can identify these inconsistencies and handle them in various ways.

{% include pattern_grid.html group="background-processes" %}

## Other
{: data-group="other"}

Other patterns for handling failure or edge cases.

{% include pattern_grid.html group="other" %}

## Antipatterns
{: data-group="antipattern"}

Some patterns exist which should be avoided. They may seem to offer benefits, but either do not deliver what they seem to or have other serious drawbacks.

{% include pattern_grid.html group="antipattern" %}

## Comparisons

When consistency is important, you will generally need to choose (at least) one of the patterns in the table below.

<div class="table-wrapper" markdown="block">

| **Pattern**                                                                        | **Systems** | **Synchronicity**                                 | **Atomicity**           | **Isolation**               | **Consistency**             | **Complexity** |
|:-----------------------------------------------------------------------------------|:------------|:--------------------------------------------------|:------------------------|:----------------------------|:----------------------------|:---------------|
| [ACID transaction]({% link _failure-patterns/acid-transaction.md %})               | One         | Sync                                              | Atomic                  | Isolated[^isolation-level]  | Immediate[^isolation-level] | Simple         |
| [Transactional outbox]({% link _failure-patterns/transactional-outbox.md %})       | Many        | Async                                             | Non-atomic[^non-atomic] | None                        | Eventual                    | Moderate       |
| [Reliable retries]({% link _failure-patterns/reliable-retries.md %})               | Many        | Async                                             | Non-atomic[^non-atomic] | None                        | Eventual                    | Moderate       |
| [Completer]({% link _failure-patterns/completer.md %})                             | Many        | Success: sync<br />Error: async[^sync-then-async] | Non-atomic[^non-atomic] | None                        | Eventual                    | Moderate       |
| [Distributed transaction]({% link _failure-patterns/distributed-transaction.md %}) | Many        | Success: sync<br />Error: async[^sync-then-async] | Atomic                  | Partial[^partial-isolation] | Eventual                    | Complex        |
| [Saga]({% link _failure-patterns/saga.md %})                                       | Many        | Async                                             | Atomic[^compensation]   | None                        | Eventual                    | Complex        |

</div>

[^isolation-level]: Depending on the isolation level. See [Transaction isolation in PostgreSQL]({% post_url 2022-01-11-postgres-isolation-levels %}).
[^non-atomic]: Non-atomic because some writes might fail with no guarantee that successful writes will be rolled back.
[^sync-then-async]: Attempts to do all work synchronously, but will continue asynchronously in the case of failure.
[^partial-isolation]: Other operations never see changes that get rolled back, but while the systems are committing they can see one system's changes before another's.
[^compensation]: Using compensating actions rather than rollback.

## More patterns

- [Wikipedia: Pattern language](https://en.wikipedia.org/wiki/Pattern_language)
- [A pattern language for microservices](https://microservices.io/patterns/index.html)
- [Messaging Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Cloud design patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/)
- [Reliability patterns](https://learn.microsoft.com/en-us/azure/architecture/framework/resiliency/reliability-patterns)
- [Patterns of Distributed Systems](https://martinfowler.com/articles/patterns-of-distributed-systems/)
- [The Seven Most Classic Patterns for Distributed Transactions](https://medium.com/@dongfuye/the-seven-most-classic-solutions-for-distributed-transaction-management-3f915f331e15)
