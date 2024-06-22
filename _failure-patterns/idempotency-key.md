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

A client may retry failed requests. In general, messages might arrive more than once, perhaps with significant delays between each arrival. To ensure idempotency, the system must be able to identify which messages are retries/duplicates of a message it has already seen.

## Example

**Posting to a social network** – A user posts "Hello world" to a chat application or a social network. They could choose to post the same text more than once, and the system would need to be able to distinguish between a retried request and someone deliberately sending the same message more than once.

**Creating a payment** – A user presses “Pay” on an app, which triggers a request to a server. The invariant the client app cares about is that only one payment gets created per user action, no matter how many times it retries sending the request to the server.

## Problem

How do we determine whether two messages have the same identity?

## Solution

Assign a value to define the identity of a message. This value is known as an **idempotency key**. Require that clients send this idempotency key along with any message they send, and send the same idempotency key when retrying.

For HTTP, this is often sent in an `Idempotency-Key` header.

Messages with idempotency keys should have two properties:

1. All instances of the same message (e.g. retries) have the same idempotency key.
2. Different messages have different idempotency keys.

There are two ways of associating an idempotency key with a message:

1. **Client-supplied** – clients (or message senders) send a dedicated idempotency key representing the identity of the message.
2. **Server-inferred** – servers (or message receivers) infer the identity of the message using a unique set of values in the message, and use this set of values as the idempotency key.

Server-inferred keys suffer some significant issues which can make property two above (different messages have different idempotency keys) impossible to achieve. For example, in the example above of posting to a social network, there is no way for the server to know the difference between two "Hello world" messages without an idempotency key.

In the payment creation example above, only the client app has the knowledge about which payment creation requests are for that particular user action, so it is the one responsible for telling the server this information. Since the server is most likely responsible for generating the ID for the payment, another mechanism is required to communicate which user action this request is for, hence a dedicated idempotency key is necessary.

{% include callout.html
  type="warning"
  content='Where possible, client-supplied idempotency keys should not be relied on for correctly maintaining _internal_ invariants. Servers must maintain their own internal invariants even if clients send different idempotency keys for retries.

  The invariant of creating a payment only once per user action is an external _client invariant_.'
%}

## See also

- [Stripe: Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency)
- [Stripe API: Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
- [An In-Depth Introduction To Idempotency](https://www.lpalmieri.com/posts/idempotency/)
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys)
