---
layout: pattern
title: Response record
short: response-record
group: single-system
description: Return the same response for every retry
related:
  - acid-transaction
  - idempotency-key
  - recovery-point
  - idempotency-key-lock
  - garbage-collection
---

## Context

It can be important to return exactly the same response every time for the same request. Due to underlying state changes, a retried request might not naturally return the exact same response every time.

## Example

The Stripe API models the status of a [payout](https://stripe.com/docs/api/payouts/object) as a state machine with the following states: `paid`, `pending`, `in_transit`, `canceled` or `failed`. Some operations, e.g. `cancel`, are only valid when the payout is in certain states. Retries of successful `cancel` requests should return the same successful response, even if the status of the payout has since changed.

## Problem

How do we return the same response, even when the underlying state changes?

## Solution

Before sending a response to the client, write it to a database. This could be indexed by an [idempotency key]({% link _failure-patterns/idempotency-key.md %}). When handling a request, first check whether a response record exists for this request. If it does, simply return that response. If the work is safe to repeat, the check can instead happen when writing the response record: if one already exists, return that instead of the new one.

This is a special case of a [recovery point]({% link _failure-patterns/recovery-point.md %}).

### Implementation decisions

Consider an endpoint which makes a credit decision. A client sends an application with an idempotency key, and gets back a decision: approved for some amount, or declined. Implementing a response record for it involves a few decisions.

#### Where to store the response

The response record could be a row in a **dedicated table**, or the **existing decision row** could double as the response record.

Reusing the credit decision row avoids an extra table and an extra insert. But because it doubles as the response record, it can't be updated. That's fine for some data, but not for anything with a lifecycle. A Stripe payout's status changes after a `cancel` request, so the payout row can't double as the response record for `cancel`.

A dedicated table costs an extra insert, and more rows to store and possibly [clean up]({% link _failure-patterns/garbage-collection.md %}). In return, the credit decision is free to change later without affecting what retries return, and the response record is one generic mechanism which could be reused for multiple endpoints.

#### Where to source the data

If the response is rebuilt from the credit decision row on every retry, everything it's built from must be immutable: the row itself, and anything joined to it.

Let's imagine we want to add the interest rate to the response.

- **Joining on the current rate** is wrong. A retry after a rate change returns a different rate from the original response. Nothing fails, and the customer has been shown two different offers. If the rates table only holds current rates, that's also the obvious join to write.
- **Joining on an immutable snapshot** of the rates at the time of the decision is correct.
- **Storing the rate on the decision** is correct, and keeps everything the response needs in one row.

Joining on a snapshot might be correct _now_, but it imposes a constraint on the snapshot table: it must stay immutable. A rates snapshot might obviously be intended to be append-only, but other tables might not have such a clear constraint, making it easy to introduce subtle bugs later.

#### Serialised bytes or underlying data

A dedicated response record could store the serialised response, or the data it's built from.

Storing the data leaves us free to change the response format, e.g. across API versions, while retries still get the same data back. Storing the bytes freezes the format too.

#### Check at the start or at the end

{% include callout.html type="aside" content="Here we'll be using `INSERT ... ON CONFLICT DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key RETURNING ...` (with PostgreSQL's semantics) as \"insert-or-get\" to ensure we get the existing row if there's a conflict." %}

**At the start**, look up the response record by idempotency key before doing any work, and return it if it exists. Retries skip evaluating the application entirely. The cost is an extra query on every request.

**At the end**, evaluate the application, then insert-or-get the response record, and return whatever the insert-or-get gives back. Retries will return the stored response. This saves the lookup, but retries evaluate the application again only to throw away the result. That's fine if evaluating is safe to repeat. Running another credit check might affect the customer's credit report, so probably isn't.

Either way, return the response as it exists in the database. If a concurrent request stored its response first, return that one.

Whether the extra query matters depends on how latency-sensitive your endpoint is. Compare the expected latency of a single indexed lookup with your overall request latency budget.

### Summary

Some possible combinations:

| Approach | Stored in | Check | Queries | Future changes must ensure |
| --- | --- | --- | --- | --- |
| Rebuild from the decision | Decision row, with joins | End | One statement | Nothing the response reads from ever changes |
| Decision as response record | Decision row, no joins | End | One statement | The row is never updated, and the response is built only from the one row |
| Separate response record | Dedicated table | Start | A lookup, then a transaction | Nothing specific to retries |
| Separate response record, no lookup | Dedicated table | End | One transaction | Evaluating stays safe to repeat |

When optimising for correctness and maintainability over performance, I think a dedicated response record and checking at the start can be worth the extra queries.

### Reusing across endpoints

A dedicated response record which is checked at the start can be made largely reusable across endpoints. Middleware can't usually write in the same transaction as the handler, so the work is split:

1. **Middleware** looks up the response record by idempotency key, and returns it if it exists.
2. Otherwise, it passes the handler a function to **store the response**, which the handler calls inside its own transaction.
3. After the handler returns, the middleware **checks that the response was stored**, and logs, alerts or otherwise fails loudly if it wasn't.

### Other considerations

None of these approaches fully protect against _concurrent_ requests. If two requests with the same idempotency key arrive at the same time, both might evaluate the application. A unique constraint on the idempotency key prevents duplicate writes, but not duplicate evaluations. Preventing that needs something else, such as an [idempotency key lock]({% link _failure-patterns/idempotency-key-lock.md %}).

Storing responses means storing whatever is in them, which might include sensitive data with its own retention requirements.

## See also

- [Stripe: Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
