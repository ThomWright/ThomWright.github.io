---
layout: pattern
title: Idempotency key (external)
short: idempotency-key-external
group: single-system
tagline: Send a request to an external system at-least-once with only a single side effect
related:
  - idempotency-key
  - recovery-point
---

## Context

Some operations involve writing to an external API which has side effects. The API could be called more than once when handling retries, but this might cause any side effects produced by the API to be repeated.

## Example

An API which sends emails.

## Problem

How do we ensure that side effects produced by the API are not repeated, even when we call it more than once?

## Solution

If the API supports it, send an idempotency key so identical requests can be detected. This allows them to reduce the probability (or eliminate the possibility) of producing the side effect more than once.
