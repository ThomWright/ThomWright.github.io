---
layout: pattern
title: Distributed transaction
short: distributed-transaction
group: multiple-systems
tagline: Write to multiple systems transactionally
related:
  - atomic-transaction
  - saga
incomplete: true
---

{% include callout.html
  type="warning"
  content="I have never used this pattern in practice."
%}

## Context

Some operations need to write to two or more transactional systems.

## Prerequisites

Eventual consistency is acceptable.

It is worth introducing significant complexity.

## Example

TODO:

## Problem

How do we achieve transactionality across all systems, such that all operations either succeed or (eventually) get rolled back?

## Solution

TODO: Sagas, compensating actions, 2-phase commit, blah blah blah

TODO: link to other articles
