---
layout: post
title: Success, failure, and uncertainty
tags: [distributed systems, reliability]
---

In a distributed system, when a client sends a request to a server to do a task, there are three possible outcomes:

1. **Success** – the client is informed that the task was done.
2. **Failure** – the client is informed that the task was *not* done.
3. **Uncertainty** – the response does not explicitly indicate either success or failure, or the client never receives a response (or does not receive a response in a reasonable time frame).

Failure and uncertainty are sometimes called [definite]({% link _failure-patterns/glossary.md %}#definite-error) and [indefinite]({% link _failure-patterns/glossary.md %}#indefinite-error) errors. Antithesis has a good [reliability glossary](https://antithesis.com/docs/resources/reliability_glossary/#preliminaries) which covers these.

Often the third case is forgotten about. Servers respond with either a successful response or an error, and an error is assumed to mean that the task was not done. That assumption isn't safe.

For example, a customer clicks "Pay". The request to the payment service times out, and the page shows "Payment failed, please try again". The customer tries again, and it works. They've now been charged twice, because the first request ended up succeeding.

It's important to be clear on what guarantees the client can rely on for each outcome, and for the server to communicate these correctly.

Let's consider some examples of explicit failures.

- **Insufficient funds** – a payment API might respond with a 402 or 422 when an account doesn't have enough money. The payment was checked and rejected, and no money moved.
- **Aborted database transaction** – when a transaction is rolled back, the database guarantees that none of its writes were committed.

What makes these failures is what the server guarantees, not the status code. A 4xx response is only an explicit failure if the server promises that it is.

And some examples of uncertainty.

- **HTTP 500** – does this represent an explicit failure? Usually not. Generally, an HTTP 500 means "something unexpected happened, all bets are off". Perhaps the server timed out writing to the database, but the data was successfully written.
- **TCP RST** – if a TCP connection dies before receiving a response, there's no guarantee about what happened on the other end of the connection. Perhaps the server crashed before completing the task, but perhaps not.
- **Timeout** – if the client gives up waiting, it can't know what happened. The request might never have arrived, it might have been processed and the response lost, or it might still be in progress.

To be reliable, a server should generally commit to a few guarantees.

1. When it sends a **successful** response, it should be guaranteed that the task was done.
2. When it sends an explicit **failure** response, it should be guaranteed that the task was *not* done.
3. Whenever there is uncertainty, this should be clearly communicated.

"Not done" means no [side effects]({% link _failure-patterns/glossary.md %}#side-effect) at all. If the task might have been partially completed – some writes committed, but not others – then the server can't report a definite failure. It either needs to make the task atomic, for example with an [ACID transaction]({% link _failure-patterns/acid-transaction.md %}), or report uncertainty.

The server can't always communicate uncertainty. If it crashes, or the network fails, it never gets the chance. So the client has a part to play too: anything which isn't an explicit success or failure must be treated as uncertain.

Servers are often clients too. Say an orders service calls a payment provider to charge a card, and the call times out. The orders service doesn't know whether the customer was charged, so it must pass that uncertainty on to its own client. Responding with a 500 is fine. Responding with "payment failed" is not – the client might reasonably tell the customer to try again, and charge them twice.

What should the client do when the state of a task is uncertain? Here are a few ideas:

1. **Retry** – if the API is idempotent, it should be safe to try again. [Idempotency keys]({% link _failure-patterns/idempotency-key.md %}) are a common way to make an API idempotent, and [reliable retries]({% link _failure-patterns/reliable-retries.md %}) can make sure the task is retried until it succeeds.
2. **Query** – if the API is not idempotent, it might be possible to query the state of the task. Often this can indicate success, but not finding the task does not necessarily indicate failure – the task might simply not be done *yet*.
3. **Pass it on** – if the client is itself a server, it can report the uncertainty to its own client and let them decide what to do.
4. **Give up** – if it's acceptable for the task not to happen, but not for it to happen twice, don't try again. Consider an [at-most-once guard]({% link _failure-patterns/at-most-once-guard.md %}).
5. **Alert** – if all else fails, alert a human to manually check what happened. [Reconciliation]({% link _failure-patterns/reconciliation.md %}) can help detect and fix inconsistencies automatically.
6. **Ignore** – in some cases, it's not important enough to do any of the above.
