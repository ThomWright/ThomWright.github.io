---
layout: pattern
title: Completer
short: completer
group: background-processes
description: Complete unfinished operations, even if clients give up retrying
related:
  - transactional-outbox
  - recovery-point
  - resumable-operation
  - reliable-retries
---

## Context

Operations can fail part way through. Clients can retry, but might give up before driving the operation to completion.

## Prerequisites

The operation is [resumable]({% link _failure-patterns/resumable-operation.md %}) and [recovery points]({% link _failure-patterns/recovery-point.md %}) are used.

It is acceptable for the operation to happen asynchronously.

## Example

Making a payment on an e-commerce system. At a high level, the operation might look like this:

1. Save order details.
2. Take payment.
3. Start fulfilment process.

Taking a payment but never starting the fulfilment process would result in some unhappy customers.

## Problem

How do we ensure that important multi-step operations are always completed?

## Solution

Run a background completer process. It should:

1. Find recovery points which are incomplete, and have not been updated recently.
2. Resume the operation. Either by running the operation itself, or by requesting the application process to do it.

The completer might resume an operation which is still in progress, e.g. a slow request which hasn't updated its recovery point recently, or one which another completer has also picked up. To make this less likely, completers can claim work before resuming it, e.g. using a lease or `SELECT … FOR UPDATE SKIP LOCKED`, or reuse an existing mechanism such as an [idempotency key lock]({% link _failure-patterns/idempotency-key-lock.md %}). This reduces wasted work, but isn't a guarantee, so the operation still needs to handle concurrent attempts safely, as described in [recovery point]({% link _failure-patterns/recovery-point.md %}).

Some operations might never complete, e.g. because of a bug, or a downstream system repeatedly rejecting a request. Limit the number of attempts, and alert someone or roll back (see [saga]({% link _failure-patterns/saga.md %})) once that limit is reached.

## Also known as

- [Active recovery](https://www.lpalmieri.com/posts/idempotency/#10-3-forward-recovery)

## See also

- [The completer](https://brandur.org/idempotency-keys)
