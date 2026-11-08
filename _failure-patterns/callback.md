---
layout: pattern
title: Callback
short: callback
group: api-design
description: Inform clients about the results of asynchronous operations
sort_key: 3
related:
  - idempotency-key
  - transactional-outbox
---

## Context

It can sometimes be useful to defer an operation, possibly because the operation takes a long time to complete or because it makes it easier to maintain consistency. The client will likely need to know when the operation completes and whether it was successful.

## Example

A CI server accepting requests to trigger a build.

## Problem

How do we inform clients about the results of deferred operations?

## Solution

1. Save the request, e.g. as a job in a database, using a client-supplied [idempotency key]({% link _failure-patterns/idempotency-key.md %}) to identify the operation. A retried request finds the existing job rather than creating a new one.
2. Respond to say the request will be processed later, e.g. with an [HTTP 202](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202).
3. Perform the operation.
4. Save the result and a message for the client in the same transaction, e.g. using a [transactional outbox]({% link _failure-patterns/transactional-outbox.md %}), so the message isn't lost if the process crashes.
5. Send the message to the client, including the idempotency key. If sending fails, retry until it succeeds.

Because of these retries, clients might receive the same message more than once, so they should use the idempotency key to deduplicate them.

## Notes

Polling is another solution to this problem, though has several drawbacks. Polling too frequently is wasteful, and too infrequently means updates will be delayed. It can still be useful alongside callbacks, as a fallback for clients that miss one.

## Also known as

- Webhooks
