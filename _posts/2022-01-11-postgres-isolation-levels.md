---
layout: post
title: Transaction isolation in PostgreSQL
---

I often forget how different isolation levels affect queries in PostgreSQL, so I wrote a quick overview to remind myself. It won't include all the details, but is hopefully fairly accurate is what it does say!

Ideally, transactions behave as if they were run one after another. They don't interact with each other while they're running, and you don't get different results depending on what other queries are running concurrently. In other words, they are completely _isolated_.

In reality, when transactions run concurrently, a there are several types of interactions (or _phenomena_) which can happen. We can control which types of interactions are allowed to happen by using "transaction isolation levels".

PostgreSQL has four (increasing) levels of isolation for transactions:

- Read uncommitted (treated the same as Read committed)
- Read committed
- Repeatable read
- Serializable

The **default** isolation level for transactions is **Read committed**. At this level, doing two SELECTs on the same row one after the other inside a transaction can read different values for that row, if another transaction has committed an update in between those two SELECTs. This is known as a _nonrepeatable read_ phenomenon.

Note that **Read uncommitted** is implemented the same as **Read committed** in PostgreSQL. In the SQL standard, this allows _dirty reads_, in which a SELECT can see modifications to a row which have not yet been committed. Dirty reads are not allowed is PostgreSQL.

At **Repeatable read** level, those two SELECTs will read the same value, even if another transaction has committed an update.

PostgreSQL's **Repeatable read** is implemented using **Snapshot isolation**. That is, at this level each query in the transaction sees the same snapshot of the database state. In contrast, at **Read committed** each query sees its own snapshot. That is, a single SELECT always sees a consistent view, it won't see updates made since the SELECT started.

At **Repeatable read**, _serialisation anomalies_ are possible. That is, to quote the documentation:

> The result of successfully committing a group of transactions is inconsistent with all possible orderings of running those transactions one at a time.

The **Serializable** isolation level prevents this. The documentation contains a good example of such an anomaly.

There is more to it than this, but this is a good enough overview to remind me what's going on!

## Further reading

- [Wikipedia: Isolation in databases](https://en.wikipedia.org/wiki/Isolation_(database_systems))
- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/14/transaction-iso.html)
- [Jepsen: Consistency models](https://jepsen.io/consistency)
- [The Art of PostgreSQL: PostgreSQL Concurrency: Isolation and Locking](https://tapoueh.org/blog/2018/07/postgresql-concurrency-isolation-and-locking/)
