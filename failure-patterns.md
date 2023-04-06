---
layout: page
title: 'Designing for failure: Patterns'
short_title: 'Failure patterns'
sitemap: false
public: false
order: 3
---

Reusable building blocks to help design reliable systems in the presence of failures.

<!-- TODO: failure patterns: link to published post -->
See the [introductory post]({% link _wip/designing-for-failure.md %}).

{% include callout.html
  type="info"
  content="These patterns are still a work in progress. Ship early and iterate, right?"
%}

## API design

Rather than internal details, these patterns describe the API as seen by clients.

{% assign api_design = site.failure-patterns | where: 'group', 'api-design' | sort: "sort_key", "last" %}
{% for pattern in api_design %}- **[{{ pattern.title }}]({{ pattern.url }})**&nbsp;–{% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}
{% endfor %}

## Writing to a single system

Patterns for writing to a single system. Most patterns assume this system is an ACID database. This is the simplest topology, and the easiest to work with. It's worth trying to design systems like this where possible, to avoid the complexity that arises from trying to maintain consistency between multiple systems.

{% assign single_system = site.failure-patterns | where: 'group', 'single-system' | sort: "sort_key", "last" %}
{% for pattern in single_system %}- **[{{ pattern.title }}]({{ pattern.url }})**&nbsp;–{% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}
{% endfor %}

## Writing to multiple systems

When writing to a single ACID database, we get atomicity and consistency built in. Things get more complicated when writing to multiple systems where we don’t have these guarantees: we might not be able to perform all writes atomically, and so can end up in an inconsistent state.

{% assign multiple_systems = site.failure-patterns | where: 'group', 'multiple-systems' | sort: "sort_key", "last" %}
{% for pattern in multiple_systems %}- **[{{ pattern.title }}]({{ pattern.url }})**&nbsp;–{% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}
{% endfor %}

## Background processes

Sometimes inconsistency is unavoidable, whether by design, or simply because of a buggy implementation. Background processes can identify these inconsistencies and handle them in various ways.

{% assign background_processes = site.failure-patterns | where: 'group', 'background-processes' | sort: "sort_key", "last" %}
{% for pattern in background_processes %}- **[{{ pattern.title }}]({{ pattern.url }})**&nbsp;–{% if pattern.incomplete %} **[WIP]**{% endif %} {{ pattern.tagline }}
{% endfor %}
