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

A user posts “Hello world” to a chat application or a social network. They could choose to post the same text more than once, and the system would need to be able to distinguish between a retried request and someone deliberately sending the same message more than once.

## Problem

How do we determine whether two messages have the same identity?

## Solution

Assign a value, or set of values, to define the identity of a message. This (set of) value(s) is known as an **idempotency key**.

There are two ways of associating an idempotency key with a message:

1. **Client-supplied** – clients (or message senders) send a dedicated idempotency key representing the identity of the operation to be performed.
2. **Server-inferred** – servers (or message receivers) infer the identity of the operation using a unique set of values in the message, and use this set of values as the idempotency key.

More detail about these two approaches is given below.

In general, whether this value is sent or inferred, any retries should have the same value so the server can identify which messages are for the same operation. The server should store this value in its database and use it to ensure that retries are idempotent.

{% include callout.html
  type="aside"
  content='Instead of thinking in terms of _message identity_, it can help to think in terms of _operation identity_. There might be multiple messages with different identities for the same logical operation.

  For example, there might be two different messages for the "settle this payment" operation: 1) a normal `PaymentSettled` event, and 2) a `CorrectStatus` command with `status: "settled"` used to manually correct data. If both arrive, only one should be processed.'
%}

### Client-supplied

#### Context

A client needs to maintain an invariant that an operation only happens once. Only the client knows the identity of the operation.

#### Example

**Creating a payment** – A user presses "Pay" on an app, which triggers a request to a server.

The invariant the client app cares about is that _only one payment gets created per user action_, no matter how many times it retries sending the request to the server. From the server's perspective, this is an **external invariant**.

#### Pattern

Require that clients send an idempotency key along with the request.

In the example above, only the client app has the knowledge about which payment creation requests are for that particular user action, so it is the one responsible for telling the server this information. Since the server is most likely responsible for generating the ID for the payment, another mechanism is required to communicate which user action this request is for, hence a dedicated idempotency key is necessary.

For HTTP, this is often sent in an `Idempotency-Key` header.

### Server-inferred

#### Context

A server needs to maintain an invariant that an operation only happens once. The server can infer the identity of the operation.

#### Example

**Settling a payment** – A message is received by a ledger informing it that an incoming payment has succeeded, and the balance on the account should be increased accordingly.

The invariant the server (the ledger) cares about is that _the balance must only be increased once per settled payment_, no matter how many "settle this payment" messages it gets. From the server's perspective, this is an **internal invariant**.

It is not possible to correctly rely on client-supplied idempotency keys in this case. Clients could mistakenly send two "settle this payment" messages with different dedicated idempotency keys. If the server only used these for idempotency, then it might settle the same payment twice.

#### Pattern

Require that messages have a natural identity associated with them, and use these as the idempotency key.

In the example above, to maintain its own invariant the server must ensure that the "settle" operation only gets performed once per payment. Therefore it should use a combination of the payment ID and a value representing the "settle" action (e.g. `new_status: "settled"`) as the idempotency key.

Using dedicated client-supplied idempotency keys results in two cases:

1. The key is consistent with the message identity – in which case the system works correctly, but the key is redundant.
2. The key is _not_ consistent with the message identity – in which case the system behaves incorrectly.

Essentially, the presence of a dedicated client-supplied idempotency key here is useless at best and harmful at worst.

## See also

- [Stripe: Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency)
- [Stripe API: Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
- [An In-Depth Introduction To Idempotency](https://www.lpalmieri.com/posts/idempotency/)
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys)
