---
layout: post
title: Success, failure, and uncertainty
tags: [distributed systems, reliability]
---

In a distributed system, when service A requests a tasks to be performed by service B, eventually one of the following will happen:

1. **Success** – service A is informed that the task was done.
2. **Failure** – service A is informed that the task was *not* done.
3. **Uncertain** – the response does not explicitly indicate either success or failure, or service A never receives a response (or does not receive a response in a reasonable time frame).

Often the third case is forgotten about. Services respond with either a successful response or an error, and an error is assumed to mean that the task was not done. This is generally incorrect.

It’s important to be really clear on what guarantees can be relied on for each, and to communicate this correctly.

Let’s consider some examples.

- **HTTP 500** – does this represent an explicit failure? Usually not. Generally, an HTTP 500 means “something unexpected happened, all bets are off”. Perhaps the service timed out writing to the database, but the data was successfully written.
- **TCP RST** – if a TCP connection dies before receiving a response, there’s no guarantee about what happened on the other end of the connection. Perhaps the service crashed before completing the task, but perhaps not.

To be reliable, a service should generally commit to a few guarantees.

1. When it sends a **successful** response, it should be guaranteed that the task was done.
2. When it sends an explicit **failure** response, it should be guaranteed that the task was *not* done.
3. Whenever there is uncertainty, this should be clearly communicated.

What should a client service do when the state of a task is uncertain? Here are a few ideas:

1. **Retry** – if the API is idempotent, it should be safe to try again.
2. **Query** – if the API is not idempotent, it might be possible to query the state of the task. Often this can indicate success, but lack of a response does not necessarily indicate failure – the task might simply not be done *yet*.
3. **Alert** – if all else fails, alert a human to manually check what happened.
4. **Ignore** – in some cases, it’s not important enough to do any of the above.
