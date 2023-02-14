---
layout: pattern
title: Reject non-identical retries
short: reject-non-identical
group: api-design
tagline: Detect changes between retries
sort_key: 2
---

## Context

It is expected that only a request and its retries will share the same idempotency key, and that retries will be identical to the original request. It is possible that clients might send two requests with the same idempotency key, but different contents. This might be a bug in the client, and might cause unexpected behaviour.

## Problem

How do we identify incorrect use of idempotency keys and inform the client?

## Solution

Decide which parts of the request content are important for identity checking, e.g. the body and certain relevant headers. Hash the contents and store them with the idempotency key. When a request is received, compare the keys and hashes. If the key matches but the hash does not, reject the request, e.g. with an [HTTP 422 status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422).
