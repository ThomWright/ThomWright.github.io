---
layout: pattern
title: Store-then-reference
short: store-then-reference
group: multiple-systems
tagline: Prevent dangling references
related:
  - post-operation-record
  - garbage-collection
---

## Context

Some operations need to write data to an external system, and write a reference to that data in another system (often a local database). Referencing data that does not exist is likely to be an invalid system state.

## Prerequisites

It is acceptable to end up with “garbage” un-referenced data.

## Example

Uploading a profile image on a social network.

## Problem

How do we prevent dangling references if writing the data fails?

## Solution

First store the data, then store the reference.

{% include related_patterns.html %}

## See also

- [Pragmatic Formal Modelling: Coordinating a Database and Blob Store](https://elliotswart.github.io/pragmaticformalmodeling/database-blob/)
