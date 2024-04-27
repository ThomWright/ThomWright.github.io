---
layout: pattern
title: Reject duplicate requests
short: reject-duplicate
group: antipattern
tagline: Return an error when a duplicate request is detected
related:
  - idempotency-key
  - reject-non-identical
  - response-record
---

## Problem

What response should a server send when it detects a duplicate of previously processed request, e.g. because it shares the same [idempotency key]({% link _failure-patterns/idempotency-key.md %})?

## Non-solution

Return an error, e.g. an HTTP 4xx.

This is a poor solution, because puts an unnecessary burden on the client to handle this error case. This becomes a significant burden when the error response does not return the same information as the original successful response. Sometimes this can even make it impossible to build a client which handles this error case.

Imagine an endpoint, `POST /bookings`, used to create a new booking on a website. Upon successful creation, the server returns the ID of the new booking in the response. However, when it detects a duplicate request, it returns HTTP 409 without any information about the booking.

If the client requires this ID, e.g. to save it to its own database, then this becomes tricky. It might be possible to query the server to find this booking, but without some other unique property and a suitable API this might be difficult or impossible. Regardless, the client needs to do more work to fetch the information about the booking because it is missing from the response.

Instead, consider returning the same successful response that was returned for the original request, e.g. using a [response record]({% link _failure-patterns/response-record.md %}). There is no good reason to return an error here – the client has not done anything wrong. It might simply be retrying because it didn't receive the response the first time, which is correct behaviour.
