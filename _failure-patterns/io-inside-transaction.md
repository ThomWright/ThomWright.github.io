---
layout: pattern
title: I/O inside transaction
short: io-inside-transaction
group: antipattern
tagline: Wrap a transaction around non-database I/O
---

## Problem

How do we write to a database and another system atomically?

## Non-solution

The following is not a solution to the problem:

1. Begin a transaction
2. Write a record to the database
3. Perform a write operation on another system (e.g. an HTTP POST request)
4. Commit the transaction

{% include figure.html
  img_src="/public/assets/failure-patterns/io-in-tx.png"
  caption="An error occurring after writing to an external system."
  size="med"
%}

It can be tempting to think of the two writes being atomic, but this is not the case. For example, if the system crashes between steps 3 and 4 then the HTTP request will succeed, but the write to the database will be rolled back.

In fact, in terms of consistency, it is no different to the following:

1. Perform a write operation on another system (e.g. an HTTP POST request)
2. Write a record to the database

Both scenarios can result in the HTTP request succeeding but the write to the database failing. The second scenario is arguably better for two reasons:

1. It is **clearly not atomic**, and not does pretend to be so.
2. It has higher database **connection utilisation**. The first scenario is holding a database connection in step 3 without using it. The longer the request takes, the lower the connection utilisation. Database connections can be scarce resources, and letting them sit idle while doing other I/O can result in worse throughput and latency.
