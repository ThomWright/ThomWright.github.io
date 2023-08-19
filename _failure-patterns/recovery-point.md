---
layout: pattern
title: Recovery point
short: recovery-point
group: multiple-systems
tagline: Record current progress to allow recovery with minimal rework
sort_key: 5
related:
  - saga
  - transactional-outbox
  - at-most-once-guard
  - store-then-reference
  - response-record
  - resumable-operation
  - completer
  - reconciliation
---

## Context

When implementing a [Resumable operation]({% link _failure-patterns/resumable-operation.md %}), it can be desirable to minimise rework, either because the operations are expensive or might produce repeated side effects. In which case we would want to perform each sub-operation at least once, while minimising the frequency of any happening more than once.

## Prerequisites

It is acceptable to perform each sub-operation at least once, and for retries to perform additional side-effects after a previous attempt fails.

## Example

Purchasing some products on an e-commerce site. The *Complete purchase* operation might need to save the order details, update stock availability, take payment, and schedule some later work such as getting the products packaged and delivered. It is desired for the API to do this synchronously and respond with either: `Success`, `OutOfStock` or `PaymentFailed`.

## Problem

How do we allow operations to continue from a known state after a failure?

## Solution

Model the operation as a state machine. Write a record to a database after successfully performing a part of the operation. This record should identify the operation (probably using an [Idempotency key]({% link _failure-patterns/idempotency-key.md %})), which state it is in, and include any necessary data needed for the next steps.

When handling a request, start by fetching the latest recovery point associated with the operation, and continue from that point.

For the example above, we might have three states: `OrderReceived`, `PaymentSuccess` and `OrderFinished` (ignoring error cases, which I realise goes against the narrative of this whole thing), and the steps would be:

1. Fetch recovery point for the idempotency key.
    - If it exists, advance to that point in the operation.
2. Transaction:
    - Insert recovery point - state: `OrderReceived`
    - Insert order details
    - Update stock availability
3. Take payment
4. Update recovery point - state: `PaymentSuccess`
5. Publish `NewOrder` message
    - In the background work will be scheduled to email the customer and start the shipping process
6. Update recovery point - state: `OrderFinished`
    - Perhaps a [Response record]({% link _failure-patterns/response-record.md %})

Steps 3-5 could be consolidated into a single step using a [Transactional outbox]({% link _failure-patterns/transactional-outbox.md %}).

{% include figure.html
  img_src="/public/assets/failure-patterns/recovery-point.png"
  alt="Sequence diagram for a recovery point"
  caption="Recovering from failure using a recovery point. The retry does not write to the external system again."
  size="med"
%}

Relying on the client to retry is a kind of **passive recovery**. This might leave the system in an inconsistent state if e.g. the process crashes while taking the payment and the client stops retrying. In which case we might want to consider **active recovery** using a [completer]({% link _failure-patterns/completer.md %}).

This pattern has focused on **forwards recovery**: attempting to successfully complete the operation. An alternative is **backwards recovery**: attempting to roll back. See [saga]({% link _failure-patterns/saga.md %}) for more information about backwards recovery.

## Also known as

- Checkpoint
- [Passive recovery](https://www.lpalmieri.com/posts/idempotency/#10-3-forward-recovery)

## See also

- [Recovery points and Atomic phases](https://brandur.org/idempotency-keys#recovery-points)
