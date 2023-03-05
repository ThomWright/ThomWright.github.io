---
layout: pattern
title: Idempotency key lock
short: idempotency-key-lock
group: multiple-systems
tagline: Protect against concurrent retries
published: false
---

## Context

It is possible for retries to arrive while a previous request is still being processed, for example because the client timed out. The operation needs protecting against concurrent retries.

## Example

TODO:

## Problem

How do we prevent concurrent retries from …
    - How do we reduce the amount of duplicate work?
    - How do we avoid having to do e.g. `INSERT IF NOT EXISTS`
    - How do

## Solution

TODO:
