---
layout: pattern
title: At-most-once guard
short: at-most-once-guard
group: multiple-systems
tagline: Write to a system at most once
related:
  - recovery-point
  - response-record
incomplete: true
---

## Context

Sometimes side effects by a system cannot be ensured to happen exactly once, e.g. because the system does not use an idempotency key. Writing to the system more than once might cause repeated side effects.

## Prerequisites

Producing the side effect zero times is acceptable, but more than once is not. It is not necessary to know whether the operation succeeded.

## Example

TODO: Triggering an x-ray machine? Probably better to irradiate someone at most once than at least once. Note: I don’t design safety-critical systems. ~~Initiating a payment. We don’t want to pay someone twice, so we must initiate the payment at most once.
OR: stock management system~~

## Problem

How do we ensure that a side effects happens at most once?

## Solution

Write a record to a database before performing the operation. If the record already exists, do not perform the operation. The operation will either succeed or fail. Subsequent retries will not attempt it again.

The existence of the record means “the operation was attempted”, but does not give any information about success or failure. It can be helpful to combine with a [recovery point]({% link _failure-patterns/recovery-point.md %}) or a [response record]({% link _failure-patterns/response-record.md %}) to signify "the operation was completed, and the result was success/failure". Since the system might crash before writing one of these records, their absence does not necessarily mean the operation failed or did not occur. If a retry sees the pre-operation record but no post-operation or response record, it should respond with appropriate uncertainty.
