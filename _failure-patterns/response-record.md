---
layout: pattern
title: Response record
short: response-record
group: single-system
description: Return the same response for every retry
related:
  - acid-transaction
  - at-most-once-guard
  - idempotency-key
  - idempotency-key-lock
  - recovery-point
  - reject-duplicate
---

## Context

It can be important to return exactly the same response every time for the same request. Due to underlying state changes, a retried request might not naturally return the exact same response every time.

## Example

The Stripe API models the status of a [payout](https://stripe.com/docs/api/payouts/object) as a state machine with the following states: `paid`, `pending`, `in_transit`, `canceled` or `failed`. Some operations, e.g. `cancel`, are only valid when the payout is in certain states. Retries of successful `cancel` requests should return the same successful response, even if the status of the payout has since changed.

## Problem

How do we return the same response, even when the underlying state changes?

## Solution

Before sending a response to the client, write it to a database, in the same transaction as the state changes that produced it. This could be indexed by an [idempotency key]({% link _failure-patterns/idempotency-key.md %}) in a unique column. When handling a request, first check whether a response record exists for this request. If it does, simply return that response.

If two requests race, both might find no response record. The unique index means only one of their transactions can commit. The other fails, and can then re-read and return the response from the winning request.

This is a special case of a [recovery point]({% link _failure-patterns/recovery-point.md %}).

## See also

- [Stripe: Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
