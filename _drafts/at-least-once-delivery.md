---
layout: post
title: Why can't we have exactly-once message processing?
---

<!-- markdownlint-disable MD036 MD033 -->

One of the big problems in distributed systems is reliably sending, processing and acknowledging messages. As such, message delivery systems such as queues often come with some guarantees about delivery. You might see terms such as "at-least-once" or "at-most-once".

When dealing with these kinds of systems I've often heard people wondering: "why not exactly once?". Or even just assuming that messages will always be delivered and processed exactly once, and perhaps ending up with slightly broken systems as a result. I want to explain why exactly-once isn't possible, and talk through some issues you might encounter as a result.

First, let's define what we mean by "exactly-once processing":

> Exactly-once processing means a message gets delivered and processed to completion exactly once. No part of the message processing happened more than once.

That might seem obvious, but people sometimes like to play games with definitions. Take Google Pub/Sub for example, who seem to define [exactly-once delivery](https://cloud.google.com/pubsub/docs/exactly-once-delivery) something more like:

> From the point of view of the message sender, the message was successfully delivered and acknowledged exactly once.

This is not the same thing. The message might have been delivered and processed more than once, but the acknowledgement got lost on the way back to the sender the first time.

They also use these definitions:

> A **redelivery** can happen either because of client-initiated negative acknowledgment of a message or when the client doesn't extend the acknowledgment deadline of the message before the acknowledgment deadline expires. Redeliveries are considered valid and system working as intended.
>
> A **duplicate** is when a message is resent after a successful acknowledgment or before acknowledgment deadline expiration.

In their "exactly-once delivery" system, redeliveries are fine, but duplicates are not. Sure. Their words, not mine.

Anyway, dodgy definitions aside, why can't we have exactly-once processing?

## TL;DR

Consider a magical function-calling-engine which calls a function on receipt of a message. It could offer one of two guarantees:

1. the function will be called (will begin) exactly once, or
2. the function will return (will finish) exactly once.

It could not guarantee both, because it doesn't know what will happen inside the function, and someone might power off the machine in the middle of it executing anyway. In 1 the intended operation might happen one or zero times (at-once-once). In 2 the operation might happen one or more times (at-least-once).

"How likely is it that someone will power off my production machine?" I hear you ask. Well, firstly, probably more likely than you think. Secondly, how likely it is isn't the point. The point is that it's possible. As well as all the other "unlikely" horrible things that can happen with real, non-magical systems.

The machine losing power is my go-to example, but other problems include:

- The function doesn't complete because an exception was thrown.
- The function ends up in an infinite loop.
- The function does finish, but an unknown amount of time later.
- The function cannot access the resources it needs e.g. sockets, database connections.
- The process exits because of an uncaught exception or panic.
- The OS kills the process because it was out of memory or segfaulted.
- The OS kills the process in response to a SIGKILL signal.

Have fun coming up with more examples!

## Some real scenarios

Let's consider two scenarios.

1. Processing a message is possible in a single atomic operation.<br>
    a. Idempotently<br>
    b. Non-idempotently<br>
2. Processing a message requires several operations which cannot be completed atomically.

1a is easy. If we can do the operation idempotently then we can simply accept at-least-once processing. No need for exactly-once.

If the operation is not naturally idempotent (e.g. sending an email or incrementing a counter) then what do we do?

Using sending an email as an example, and assuming the provider does not use an [idempotency key system](https://brandur.org/idempotency-keys):

1. 🔒 Try acquiring a lock for the message.
    1. Nack the message if the lock is already taken.
    2. Otherwise continue.
2. Check if the message has already been processed.
    1. Ack message and release the lock if so.
    2. Otherwise continue.
3. 📨 Send email.
4. Record the message as having been processed.
5. 🔓 Release lock.

This is pretty good, but not perfect.

What happens if the service crashes in between 2 and 3? Or between 3 and 4? We end up with an active (orphaned) lock, and no record of the message having been processed. The email might have been sent... or not. Eventually the lock will time out, and we'll be able to acquire it again. We'll then perform the operation again when the message gets redelivered. We're processing the message _at-least-once_.

Now, what about scenario 2 above, where we do _multiple_ operations, not just the one. How is this different? Well, there are a whole bunch more opportunities for the process to crash and leave things in an inconsistent state.

## Multiple operations

A common pattern I see is to write something to a database and then publish a message. Let's think about some possibilities here, again assuming we can't idempotently publish this message.

1. The initial write to the database succeeds.
2. ⚠️ **Publishing the message fails.**
3. The incoming message gets redelivered.
4. The second write to the database always fails with a uniqueness constraint error.

**Result**: zero messages get published. _At-most-once_.

**Fix**: make the database write idempotent. ✅

OK then, how about this:

1. The initial write to the database succeeds.
2. Publishing the message succeeds.
3. ⚠️ **Acknowledging the incoming message fails, or the process dies before sending the ack.**
4. The incoming message gets redelivered.
5. ✅ The second write to the database does nothing.
6. The message gets published again.

**Result**: the message get published multiple times. _At-least-once_.

**Fix**: What if we record that we successfully published? ❓

1. The initial write to the database succeeds.
2. Publishing the message succeeds.
3. Recording the the publication succeeds
4. ⚠️ **Acknowledging the incoming message fails, or the process dies before sending the ack.**
5. The incoming message gets redelivered.
6. The second write to the database does nothing.
7. ✅ We see that we've already published the message, so we ack the incoming message.

**Result**: the message gets published once.

Perfect! Well... not quite:

1. The initial write to the database succeeds.
2. Publishing the message succeeds.
3. ⚠️ **The process crashes.**
4. The incoming message gets redelivered.
5. The second write to the database does nothing.
6. The message gets published again.

**Result**: the message get published multiple times. _At-least-once_.

We can reduce the likelihood of publishing the message twice, but not prevent it entirely. This is the essence of at-least-once message processing.

## Design questions

Questions to ask when designing systems like this:

- Can these operations be made idempotent?
- Is it acceptable for the non-idempotent side-effects to happen more than once?
- Is it acceptable for the non-idempotent side-effects to happen zero times?

The answers will influence the design of the system.

## Further reading

- [Google Pub/Sub docs](https://cloud.google.com/pubsub/docs/overview)
  - [At-Least-Once delivery](https://cloud.google.com/pubsub/docs/subscriber#at-least-once-delivery)
  - [Exactly-once delivery](https://cloud.google.com/pubsub/docs/exactly-once-delivery)
- [Microservice patterns: Messaging](https://microservices.io/patterns/communication-style/messaging.html)
- [Microservice patterns: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Publish-subscribe pattern](https://www.enterpriseintegrationpatterns.com/patterns/messaging/PublishSubscribeChannel.html)
- [Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys)
- [Akka: Message Delivery](https://doc.akka.io/docs/akka/current/general/message-delivery-reliability.html#discussion-what-does-at-most-once-mean-)
