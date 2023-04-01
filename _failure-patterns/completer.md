---
layout: pattern
title: Completer
short: completer
group: background-processes
tagline: Complete unfinished operations, even if clients give up retrying
related:
  - transactional-outbox
  - recovery-point
  - resumable-operation
incomplete: true
---

TODO:

From [https://brandur.org/idempotency-keys](https://brandur.org/idempotency-keys)

- a helping hand with Resumable operations
- store request in event log before processing
- clients might give up retrying and leave unfinished operations lying around
- the completer finds these and drives them to completion

## Context

TODO:

## Prerequisites

TODO: recovery points?

## Example

TODO:

## Problem

TODO:

## Solution

TODO:

## Also known as

- [Active recovery](https://www.lpalmieri.com/posts/idempotency/#10-3-forward-recovery)
