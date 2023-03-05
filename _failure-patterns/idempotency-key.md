---
layout: pattern
title: Idempotency key
short: idempotency-key
group: api-design
tagline: Identify identical requests
sort_key: 1
---

## Context

A client may retry failed requests. To ensure idempotency, the system must be able to identify which requests are retries of a request it has already seen.

## Example

A user posts “Hello world” to a chat application or a social network. They could choose to post the same text more than once, and the system would need to be able to distinguish between a retried request and someone repeating themselves.

## Problem

How do we determine whether two requests have the same identity?

## Solution

Send a unique value, called an idempotency key, along with the request. This same value is sent with any retries, so the server can identify which requests are the same.
