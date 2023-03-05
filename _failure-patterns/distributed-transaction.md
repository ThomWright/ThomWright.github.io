---
layout: pattern
title: Distributed transaction
short: distributed-transaction
group: multiple-systems
tagline: Write to multiple systems transactionally
related:
  - atomic-transaction
---

## Context

Some operations need to write to two or more transactional systems.

## Prerequisites

Eventual consistency is acceptable.

## Example

TODO:

## Problem

How do we achieve transactionality across all systems, such that either all operations succeed or (eventually) get rolled back?

## Solution

TODO: Sagas, compensating actions, 2-phase commit, blah blah blah
