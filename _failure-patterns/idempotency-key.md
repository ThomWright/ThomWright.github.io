---
layout: pattern
title: Idempotency key
short: idempotency-key
group: api-design
tagline: Identify identical requests
sort_key: 1
related:
  - atomic-read-then-write
  - change-record
  - response-record
  - recovery-point
---

## Context

A client may retry failed requests. To ensure idempotency, the system must be able to identify which requests are retries of a request it has already seen.

## Example

A user posts “Hello world” to a chat application or a social network. They could choose to post the same text more than once, and the system would need to be able to distinguish between a retried request and someone repeating themselves.

## Problem

How do we determine whether two requests have the same identity?

## Solution

Require clients send a unique value, called an idempotency key, along with the request. This same value should be sent with any retries, so the server can identify which requests are the same. Store this value in the database. If the value already exists, the request is a retry.

This can be a dedicated ID in e.g. an `Idempotency-Key` header. Alternatively, it could be an existing ID naturally associated with the resource or operation.

## See also

- [Stripe: Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency)
- [Stripe API: Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
- [An In-Depth Introduction To Idempotency](https://www.lpalmieri.com/posts/idempotency/)
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys)
