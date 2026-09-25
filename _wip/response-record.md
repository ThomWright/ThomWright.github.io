---
layout: pattern
title: Response record
short: response-record
group: single-system
tagline: Return the same response for every retry
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

### Trade-offs

Consider an endpoint which makes a credit decision. A client sends an application with an idempotency key, and gets back a decision: approved for some amount, or declined. There are (at least) four ways to make retries return the same response.

In these examples, a response record stores the data the response is built from, rather than the serialised response itself. That leaves us free to change the response format, e.g. across API versions. Storing the exact bytes would freeze the format too, which is another alternative.

{% include callout.html type="aside" content="In these examples we'll be using `INSERT ... ON CONFLICT DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key RETURNING ...` as \"insert-or-get\" to ensure we get the existing row if there is a conflict." %}

**A. Rebuild from the decision** – Store the decision, and build the response from it.

1. Evaluate the application.
2. Insert-or-get the decision by idempotency key, recording the minimum information needed to represent the decision. Join on any necessary tables to return the response. All joined data must be immutable.

**B. Decision as response record** – The same steps as A, with a rule: the decision row holds everything the response needs, and the response is built from nothing else. No joins on other tables.

**C. Separate response record** – Store the response alongside the decision.

1. Look up a response record by idempotency key. If one exists, return it.
2. Evaluate the application.
3. Transaction:
    - Insert-or-get the decision, returning it along with any data the response needs from other tables.
    - Insert-or-get the response record, built from the data returned by the previous query.
4. Return the response from the insert-or-get. Usually it's the one this request just stored, but it might have been stored by a concurrent request.

**D. Separate response record, no lookup** – The same as C, without step 1.

1. Evaluate the application.
2. Transaction:
    - Insert-or-get the decision, returning it along with any data the response needs from other tables.
    - Insert-or-get the response record, built from the data returned by the previous query.
3. Return the response from the insert-or-get, which on a retry is the previously stored one.

All four are correct. A retry gets the original decision back from each of them.

Some obvious differences:

- **Number of tables** – C and D need an extra table to store the response separately from the decision.
- **Number of queries** – A and B need a single statement. C needs a lookup, then a transaction with two inserts. Depending on the implementation, that's anywhere from two round trips (e.g. both inserts in one statement using a CTE) to five (`SELECT`, `BEGIN`, `INSERT`, `INSERT`, `COMMIT`). D needs just the transaction.

Let's imagine we then want to add the interest rate to the response, and see how each approach handles changes in the interest rate.

- In A, it depends which rate we join on. Joining on an immutable snapshot of the rates at the time of the decision is correct. Joining on the current rate isn't: a retry after a rate change returns a different rate from the original response. Nothing fails, and the customer has been shown two different offers. If the rates table only holds current rates, that's also the obvious join to write.
- In B, the rate has to be stored on the decision. This relies on whoever makes the change knowing and sticking to the rule.
- In C and D, the join is fine. The response is built once, and retries return whatever was stored.

It's tempting to compare these on whether they're correct. But all four are correct today. There are still important differences in where the complexity lives, and what maintainers need to think about and get right when making changes.

| Approach | Queries | Number of tables | Where the complexity lives | Future changes must ensure |
| --- | --- | --- | --- | --- |
| A. Rebuild from the decision | One statement | One | Implicitly, in every table the response reads from | Nothing the response reads from ever changes |
| B. Decision as response record | One statement | One | In one table, and a rule about how the response is built | The row is never updated, and the response is built only from it |
| C. Separate response record | A lookup, then a transaction | Two | In one generic mechanism, including storage and clean-up | Nothing specific to retries |
| D. Separate response record, no lookup | One transaction | Two | Same as C | Evaluating stays safe to repeat |

A is the simplest to write, and the hardest to keep correct. Its complexity isn't in the code at all. It's in an assumption about other tables, possibly owned by other teams, which makes it easy to miss.

B narrows the complexity to one table and the code which builds the response from it, but "no joins" is still a rule someone has to know about.

C is correct by construction. Whatever data the response contains, and however it was gathered, retries get the same data back. Unlike in B, the decision itself is free to change later, e.g. when the loan is accepted, without affecting what retries return. C also avoids re-evaluating the application on retries, which in A, B and D might have side effects of its own, such as running another credit check.

D gives the same guarantee as C, at close to the cost of A and B: one extra insert in the same transaction. The cost moves to the retry path instead. A retry evaluates the application again, only to throw away the result. Retries are rare, so that's fine for performance, but only if evaluating is safe to repeat.

When optimising for correctness and maintainability over performance, I think a separate response record can be worth the extra queries: D if evaluating is safe to repeat, C if it isn't.

None of these approaches fully protect against _concurrent_ requests. If two requests with the same idempotency key arrive at the same time, both might evaluate the application. A unique constraint on the idempotency key prevents duplicate writes, but not duplicate evaluations. Preventing that needs something else, such as an [idempotency key lock]({% link _failure-patterns/idempotency-key-lock.md %}).

Whether the extra queries matter depends on your actual numbers. A few indexed queries might add a few milliseconds. If your SLO is in the hundreds of milliseconds, that's likely to be noise. If you're working on a high-throughput, latency-critical path where every millisecond counts, the calculation might come out differently.

There are other costs to consider:

- Response records accumulate, so they might need [cleaning up]({% link _failure-patterns/garbage-collection.md %}) after some retention period.
- Storing responses means storing whatever is in them, which might include sensitive data with its own retention requirements.

## See also

- [Stripe: Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
