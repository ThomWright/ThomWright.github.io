---
layout: pattern
title: Callback
short: callback
group: api-design
tagline: Inform clients about the results of asynchronous operations
sort_key: 3
related:
  - transactional-outbox
---

## Context

In sometimes be useful to defer an operation, possibly because the operation takes a long time to complete or because it makes it easier to maintain consistency. The client will likely need to know when the operation completes and whether it was successful.

## Example

A CI server accepting requests to trigger a build.

## Problem

How do we inform clients about the results of deferred operations?

## Solution

First, return a response indicating that the message will be processed later, e.g. an [HTTP 202](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202). After the operation completes send a message to the client with the result. If sending the message fails, retry until it succeeds.

## Notes

Polling is another solution to this problem, though has several drawbacks. Polling too frequently is wasteful, and too infrequently means updates will be delayed.

## Also known as

- Webhooks
