---
layout: pattern
title: Reconciliation
short: reconciliation
group: background-processes
tagline: Detect and resolve inconsistencies
incomplete: true
---

## Context

It is generally not possible to 100% ensure consistency between independent systems. Even in the best-designed systems, bugs can exist or be introduced. In some cases it can be important to know when any inconsistencies appear so they can be corrected.

## Example

A e-wallet company stores users’ e-money transactions and balances in their own systems. These are linked to underlying transactions and balances with their banking partner in fiat currency. It is essential that these match.

## Problem

How do we detect and fix inconsistencies between disparate systems?

## Solution

Compare state between the two systems. There will be three outcomes for any inconsistency found:

- Pending&nbsp;– the system has not had long enough to become consistent. Wait and do nothing.
- Resolvable&nbsp;– the reconciliation system can automatically resolve the inconsistency. Apply the change.
- Unresolvable&nbsp;– the inconsistency needs manual intervention. Raise an alert.

TODO:

- Need a bit more detail on how to compare the state… We probably can’t compare the *whole* state all the time!
- Discuss using ETLs to put data in a single place to perform reconciliation?
