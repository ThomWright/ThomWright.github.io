---
layout: pattern
title: Response record
short: response-record
group: single-system
tagline: Return the same response for every retry
related:
  - atomic-transaction
  - idempotency-key
  - post-operation-record
---

## Context

It can be important to return exactly the same response every time for the same request. Due to underlying state changes, a retried request might not naturally return the exact same response every time.

## Example

The Stripe API models the status of a [payout](https://stripe.com/docs/api/payouts/object) as a state machine with the following states: `paid`, `pending`, `in_transit`, `canceled` or `failed`. Some operations, e.g. `cancel`, are only valid when the payout in certain states. Retries of successful `cancel` requests should return the same successful response, even if the status of the payout has since changed.

## Problem

How do we return the same response, even when the underlying state changes?

## Solution

Record the response before sending it to the client. On subsequent retries, return this response. This could be indexed by an idempotency key.

{% include related_patterns.html %}
