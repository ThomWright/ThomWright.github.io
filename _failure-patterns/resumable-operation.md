---
layout: pattern
title: Resumable operation
short: resumable-operation
group: multiple-systems
tagline: Allow operations to continue from where the previous attempt failed
sort_key: 4
related:
  - transactional-outbox
  - recovery-point
  - store-then-reference
  - completer
  - idempotency-key
---

## Context

Some requests need to write to several independent systems. Operations on independent systems may fail independently, or the system might crash in between writes, leaving an operation partially-complete and the system in an inconsistent state.

## Prerequisites

It is acceptable to perform each sub-operation at least once, and for retries to perform additional side-effects after a previous attempt fails.

## Example

Uploading a profile image to a social network. The image gets stored in a blob store, then a reference stored in a separate database. The system might crash at any point before uploading the image, before storing the reference, or before sending the response. Retries should be allowed to continue the operation to completion.

## Problem

How do we increase the proportion of operations which eventually succeed, even when some sub-operations fail?

## Solution

Design your operation such that repeated attempts to perform the operation do not fail, and use retries or a [Completer]({% link _failure-patterns/completer.md %}) to drive the operation to completeness.

If relying on retries, be aware that most clients won't retry forever, and so the operation might end up incomplete indefinitely.

Designing operations to be continued can be tricky. Consider using [Recovery points]({% link _failure-patterns/recovery-point.md %}) to make this easier and avoid repeating work.

One technique I use is to write out each atomic step as a series of bullet points. I then ask myself: "What would happen if the operation failed before completing each step? What would happen when a retry arrives after that failure?".

## Notes

Resumable operations are not strictly idempotent: retries may cause additional side effects and return different responses. However, retries are **safe** -- they will not duplicate side effects and will only advance progress towards the same successful outcome. See the discussion of idempotency for incomplete operations in the [introduction]({% post_url 2023-04-06-designing-for-failure %}).
