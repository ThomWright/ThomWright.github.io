---
layout: page
title: 'Designing for failure: Patterns'
short_title: 'Failure patterns'
order: 3
---

<!-- markdownlint-disable MD033 -->

Reusable building blocks to help design reliable systems in the presence of failures.

See the [introductory post]({% post_url 2023-04-06-designing-for-failure %}).

{% include callout.html
  type="info"
  content="These are still a work in progress. Feedback appreciated!"
%}

## API design

Rather than internal details, these patterns describe the API as seen by clients.

{% assign api_design = site.failure-patterns | where: 'group', 'api-design' | sort: "sort_key", "last" %}
{% for pattern in api_design %}[{{ pattern.title }}]({{ pattern.url }})

: {% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}

{% endfor %}

## Writing to a single system

Patterns for writing to a single system. Most patterns assume this system is an ACID database. This is the simplest topology, and the easiest to work with. It's worth trying to design systems like this where possible, to avoid the complexity that arises from trying to maintain consistency between multiple systems.

{% assign single_system = site.failure-patterns | where: 'group', 'single-system' | sort: "sort_key", "last" %}
{% for pattern in single_system %}[{{ pattern.title }}]({{ pattern.url }})

: {% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}

{% endfor %}

## Writing to multiple systems

When writing to a single ACID database, we get atomicity and consistency built in. Things get more complicated when writing to multiple systems where we don’t have these guarantees: we might not be able to perform all writes atomically, and so can end up in an inconsistent state.

{% assign multiple_systems = site.failure-patterns | where: 'group', 'multiple-systems' | sort: "sort_key", "last" %}
{% for pattern in multiple_systems %}[{{ pattern.title }}]({{ pattern.url }})

: {% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}

{% endfor %}

## Background processes

Sometimes inconsistency is unavoidable, whether by design, or simply because of a buggy implementation. Background processes can identify these inconsistencies and handle them in various ways.

{% assign background_processes = site.failure-patterns | where: 'group', 'background-processes' | sort: "sort_key", "last" %}
{% for pattern in background_processes %}[{{ pattern.title }}]({{ pattern.url }})

: {% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}

{% endfor %}

## Other

Other patterns for handling failure or edge cases.

{% assign other = site.failure-patterns | where: 'group', 'other' | sort: "sort_key", "last" %}
{% for pattern in other %}[{{ pattern.title }}]({{ pattern.url }})

: {% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}

{% endfor %}

## Antipatterns

Some patterns exist which should be avoided. They may seem to offer benefits, but either do not deliver what they seem to or have other serious drawbacks.

{% assign antipatterns = site.failure-patterns | where: 'group', 'antipattern' | sort: "sort_key", "last" %}
{% for pattern in antipatterns %}[{{ pattern.title }}]({{ pattern.url }})

: {% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}

{% endfor %}

## Comparisons

When consistency is important, you will generally need to choose (at least) one of the patterns in the table below.

<div class="table-wrapper" markdown="block">

| **Pattern**                                                                        | **Number of systems** | **Synchronicity**                   | **Atomicity**  | **Consistency** | **Complexity** |
|:-----------------------------------------------------------------------------------|:----------------------|:------------------------------------|:---------------|:----------------|:---------------|
| [ACID transaction]({% link _failure-patterns/acid-transaction.md %})               | One                   | Sync                                | Atomic         | Strong          | Simple         |
| [Transactional outbox]({% link _failure-patterns/transactional-outbox.md %})       | Many                  | Async                               | Non-atomic[^2] | Eventual        | Moderate       |
| [Reliable retries]({% link _failure-patterns/reliable-retries.md %})               | Many                  | Async                               | Non-atomic[^2] | Eventual        | Moderate       |
| [Completer]({% link _failure-patterns/completer.md %})                             | Many                  | Success: sync<br />Error: async[^1] | Non-atomic[^2] | Eventual        | Moderate       |
| [Distributed transaction]({% link _failure-patterns/distributed-transaction.md %}) | Many                  | Success: sync<br />Error: async[^1] | Atomic         | Eventual        | Complex        |
| [Saga]({% link _failure-patterns/saga.md %})                                       | Many                  | Async                               | Atomic         | Eventual        | Complex        |

</div>

[^1]: Attempts to do all work synchronously, but will continue asynchronously in the case of failure.
[^2]: Non-atomic because some writes might fail with no guarantee that successful writes will be rolled back.

## More patterns

- [Wikipedia: Pattern language](https://en.wikipedia.org/wiki/Pattern_language)
- [A pattern language for microservices](https://microservices.io/patterns/index.html)
- [Messaging Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Cloud design patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/)
- [Reliability patterns](https://learn.microsoft.com/en-us/azure/architecture/framework/resiliency/reliability-patterns)
- [Patterns of Distributed Systems](https://martinfowler.com/articles/patterns-of-distributed-systems/)
- [The Seven Most Classic Patterns for Distributed Transactions](https://medium.com/@dongfuye/the-seven-most-classic-solutions-for-distributed-transaction-management-3f915f331e15)
