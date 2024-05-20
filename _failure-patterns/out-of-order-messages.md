---
layout: pattern
title: Handling out of order messages
short: out-of-order-messages
group: other
tagline: Reliably process dependent messages in any order
sort_key: 1
incomplete: true
---

## Context

Message are usually not guaranteed to arrive in order. However, sometimes messages have logical ordering. When there is a hard dependency between messages, it might not be possible to process later messages (in the logical ordering) without information from earlier messages.

In many cases the messages arrive in the expected order _almost_ all of the time, so if a system is unable to handle out of order messages it might go unnoticed for a long time.

## Example

A payment goes through the following lifecycle:

```text
created -> succeeded
       `-> failed
```

With the following associated events:

```protobuf
message PaymentCreated {
  string id = 1;
  google.protobuf.Timestamp created_at = 2;
  uint64 amount = 3;
  string currency = 4;
}

message PaymentSucceeded {
  string id = 1;
  google.protobuf.Timestamp succeeded_at = 2;
}

message PaymentFailed {
  string id = 1;
  google.protobuf.Timestamp failed_at = 2;
}
```

It might be expected that `PaymentCreated` will always be received first, but this is not guaranteed. The `PaymentCreated` event contains potentially vital information (amount and currency) not included in the later events. With this design, it might be difficult to process `PaymentSucceeded` independently without that information.

## Problem

How do we gracefully handle out of order messages, even when there are hard dependencies between them?

## Solutions

### Independently processable messages

If possible, design the messages such that they can be processed in any order. For example, the `PaymentSucceeded` event could contains all the necessary information to be processed without any preceding events.

```proto
message PaymentCreated {
  string id = 1;
  google.protobuf.Timestamp created_at = 2;
  uint64 amount = 3;
  string currency = 4;
}

message PaymentSucceeded {
  string id = 1;
  google.protobuf.Timestamp succeeded_at = 2;
  uint64 amount = 3;
  string currency = 4;
}

message PaymentFailed {
  string id = 1;
  google.protobuf.Timestamp failed_at = 2;
  uint64 amount = 3;
  string currency = 4;
}
```

If that is not possible, then consider a design such as the following.

### Ordered event log

Given two events with a natural ordering `A -> B`, where we are unable to process `B` until `A` has arrived:

Handler for A

: _Ensure that if `B` arrives first, we process it as soon as `A` arrives._

  1. Insert event `A` into an ordered log
  2. Check for presence of associated event `B` in the log, prior to `A`
     - If exists, process `A` and then `B`
     - Else, process `A` as usual

Handler for B

: _Ensure that if `B` arrives first, it is stored for later._

  1. Insert event `B` into an ordered log
  2. Check for presence of associated event `A` in the log, prior to `B`
     - If exists, process `B`
     - Else, no-op

This solution relies on an ordered event log, where it is guaranteed that if an event with [ordinal](https://en.wikipedia.org/wiki/Ordinal_number) N exists in the log, all events with ordinal < N exist in the log and are visible.

An event log might not be necessary, but is a nice general-purpose solution to this problem.

## Alternatives

### Delay and replay

It can be tempted to simply delay the processing of out of order messages, in the hope that the required preceding messages will arrive soon.

This has the drawback of creating unnecessary delays. If we delay message `B` for one minute, but the required message `A` arrives after one second, then we will process `B` 59 seconds later than necessary. Ideally, we want to process messages as soon as possible.

Also, this approach is in some sense a "hack". The system is not able to properly handle the out of order messages, so we delay them until they _are_ in order. Arguably a better approach is to design the system such that it can handle messages in any order.
