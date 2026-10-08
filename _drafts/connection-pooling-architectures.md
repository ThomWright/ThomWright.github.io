---
title: "Connection pooling architectures"
layout: post
tags: [databases, postgresql, connection pooling, performance, architecture]
---

I've [previously talked about]({% post_url 2026-02-21-local-vs-shared-pool %}) how using local vs shared connection pools can significantly change the number of open connections to your database. This isn't the only thing to consider when designing a connection pooling architecture, so this post will go more in depth on different approaches and their trade-offs.

<!-- markdownlint-disable MD033 -->

Some simplifying assumptions we'll be making:

- We're connecting to vanilla PostgreSQL. Other databases differ in the details, but the concepts should still apply.
- Connections use TLS 1.3, and [SCRAM-SHA](https://www.postgresql.org/docs/18/auth-password.html#AUTH-PASSWORD) for authentication.
- Each request acquires one connection, new or pooled, and holds it until the request finishes.
- The pooler authenticates clients the same way as the database, though it doesn't have to.

We might sometimes call the database's end of a connection a _backend_. In PostgreSQL, each backend is a separate OS process.

Let's start by looking at the full cost of establishing a connection to a database.

{% include diagram.html
  name="pg-connect"
  caption="Connecting to PostgreSQL over TLS with SCRAM authentication, then running a query"
  alt="A sequence diagram between the application and the database. A TCP handshake, after which the database forks a backend process. Two round trips for TLS: SSLRequest, then ClientHello and ServerHello. Three round trips for SCRAM authentication: startup, client-first, then the application hashes the password 4096 times before client-final, ending with the database ready. Then a single query round trip."
%}

That's six round trips to the database before we can make a query! Plus a load of hashing. We probably don't want to do this very often if we can avoid it.

With this in mind, let's look at a few key decisions we need to make when designing a connection pooling architecture.

## Adding a local pool

We'll start with the simple case: an application connecting directly to the database. We need to decide whether our application should have a connection pool.

{% include diagram.html
  name="pool-patterns-direct"
  alt="Three application processes, each connecting directly to the database."
  caption="Connecting directly to the database: per request"
%}

{% include diagram.html
  name="pool-patterns-seq-direct"
  alt="A sequence diagram of one request. The application connects to the database, which takes six round trips plus hashing, and the database forks a backend. Then the application sends a query and gets rows back."
  caption="Each request connects before it can query"
%}

Without a pool, we need to establish a new connection every time. This adds request latency, as well as load on the database (and the client, if the auth is expensive).

With a pool, most of the time when we request a connection we'll get an existing one, so no round trips to the database, no auth etc.

{% include diagram.html
  name="pool-patterns-direct-local"
  alt="Three application processes, each with its own pool, connecting to the database."
  caption="Connecting directly to the database: through a local pool"
%}

{% include diagram.html
  name="pool-patterns-seq-direct-local"
  alt="A sequence diagram of one request. The application sends a query to the database and gets rows back, with no connect step."
  caption="With a warm pool, a request can acquire a connection immediately and send a query"
%}

The trade-off is a higher number of connections, which [scales badly]({% post_url 2026-02-21-local-vs-shared-pool %}) with respect to the number of application replicas. This is especially bad for PostgreSQL, where each connection is a separate process with its own memory.

Similar to caches, pools can introduce thundering herd and [metastability](https://brooker.co.za/blog/2021/08/27/caches.html) issues. When an application restarts, it will have a cold pool and potentially need to establish many connections concurrently. If the database is sized for the load from warm pools, it might take longer to process connection attempts. Connections get slower, and if timeouts are set too short, connections fail. [Retries]({% post_url 2022-09-12-retries-upon-retries %}) try creating even more connections, and the database might not recover.

To solve these problems, what if we introduced a shared connection pooler? We then have another decision to make: do we want to keep our local application pool, or offload pooling entirely to the pooler?

## Adding a shared pooler

Let's first look at replacing the application-side pool with a shared pooler.

{% include diagram.html
  name="pool-patterns-wiring-pooler"
  alt="Two of three applications each have one connection to the pooler, for a request in flight. Inside the pooler, each is wired straight through to its own database connection. The pooler also keeps one idle database connection spare, not wired to any client, so the database has three backends."
  caption="Connecting through a pooler: requests in flight hold a backend each, plus the pooler might have some spare"
%}

As discussed, this can significantly reduce the number of connections, and therefore the number of database backends. The database also no longer sees a new connection for every request. But what's the catch? Well, instead of just taking an existing connection from its own pool, the application needs to connect _to the pooler_. This can add significant latency to every request.

{% include diagram.html
  name="pool-patterns-seq-pooler"
  alt="A sequence diagram of one request through a pooler, without a local pool. The application connects to the pooler, which takes six round trips plus hashing, but nothing reaches the database. Then the query goes to the pooler, which forwards it to the database, and the rows come back the same way."
  caption="Connecting through a pooler: the client still pays to connect to the pooler, but can sometimes reuse existing database connections"
%}

Now, there are some potential optimisations to be made here. For example, PostgreSQL 17+ has [`sslnegotiation=direct`](https://www.postgresql.org/docs/17/libpq-connect.html#LIBPQ-CONNECT-SSLNEGOTIATION), which cuts out one round trip by starting the TLS handshake straight away. MySQL has [`caching_sha2_password`](https://dev.mysql.com/doc/refman/8.4/en/caching-sha2-pluggable-authentication.html), which caches successful authentications so that reconnecting takes a shorter path. If the pooler supports these, then that can help. But if the application isn't pooling its own connections to the pooler, then fundamentally there's going to be some overhead: at least two round trips (TCP and TLS) before the first query.

Let's try to solve this problem by _also_ pooling connections application side. To start with, it's simplest to assume that each connection to the pooler uniquely owns a backend connection to the database.

{% include diagram.html
  name="pool-patterns-pooler-local"
  alt="Three application processes, each with its own pool, connect to a shared pooler, which connects to the database."
  caption="Connecting through a pooler with local pools"
%}

Does that solve the acquisition latency problem? Well, yes, but it also reintroduces a previous problem: high backend connection usage. All idle connections in the application pools still hold a backend connection in the pooler, so the total number of backends remains high.

{% include diagram.html
  name="pool-patterns-wiring-pooler-local"
  alt="Three applications, each with a local pool of two connections to the pooler. Two connections are in use and four are idle. Inside the pooler, all six are wired straight through to their own database connection. The pooler also keeps one idle database connection spare, not wired to any client, so the database has seven backends, five of them idle."
  caption="Local pools through a pooler: idle connections (dashed) still hold a backend each, on top of the pooler's spare"
%}

Any time a connection is idle in an application pool, it can't be used by another replica.

{% include diagram.html
  name="pool-patterns-session"
  alt="A timeline of three backends. Each is held by one client connection, A, B or C, for the whole time, including while the connection is idle between transactions."
  caption="Each client connection (A, B, C) holds a backend for its whole life, even while idle between transactions"
%}

It's not all bad though. When an application restarts, its old connections close and their backends go back to the pooler, ready to hand to the new process's cold pool. The new process still connects to the pooler, but the pooler absorbs the burst of new connections.

Another, perhaps minor, disadvantage: every query goes through an extra network hop. How bad this is depends on the additional latency this adds, influenced by e.g. network topology (how close the pooler is to the application/database), and also how congested the pooler is.

{% include diagram.html
  name="pool-patterns-seq-pooler-local"
  alt="A sequence diagram of one request through a pooler, with a local pool. The query goes to the pooler, which forwards it to the database, and the rows come back the same way."
  caption="A local pool through a pooler: no connect, but every query takes the extra hop"
%}

### Operating a pooling service

A pooler is one more component to run, and running it well takes some thought. An elephant in the room at this point is that we've assumed there's only _one_ instance of the pooler, for simplicity. In reality, we'd want several (likely at least three) for redundancy. Otherwise, any downtime turns into a complete outage, and any restart reintroduces the full cold start problem.

{% include diagram.html
  name="pool-patterns-poolers"
  alt="Four application processes, any of which can connect to either of two poolers. Both poolers connect to the database."
  caption="Several applications sharing several poolers, with load balanced connection requests"
%}

The reduction in backend connections comes from having fewer pools, because fewer pools enable more connection sharing within each pool. If you have `N` application replicas connecting to `K` pooler instances and `N == K`, then most of the efficiency gains of an external pooler have gone. It only really makes sense to have `N >> K`. This implies it's only worth it if you regularly have many more than three application instances connecting to a database.

Another thing: poolers are stateful. How do they restart without affecting the application? Force close all their connections? Not a great experience: on average, `1/K` of each application's connections would suddenly die. Remove themselves from the load balancer and let the connections drain? Much better, but with local pools this could take a long time, unless the applications regularly recycle their connections, e.g. with a maximum connection lifetime. There are, in fact, [clever things you can do](https://blog.cloudflare.com/ecdysis-rust-graceful-restarts/) to hand over the listening socket to a new process on the same machine, so it can accept new connections without downtime (PgBouncer [does something similar](https://www.pgbouncer.org/usage.html#shutdown-wait_for_clients) with `so_reuseport`). But existing connections still need to drain from the old process.

Speaking of recycling connections, probably both the application and the pooler want to configure a maximum lifetime for their connections. The pooler can only close a backend once the client connection using it disconnects, so if the lifetimes are similar, most application reconnects also mean a database reconnect. Instead, we want:

- **Application -> pooler**: short, so connections drain in a reasonable time, and rebalance after a pooler restart. Add jitter, so connections opened together don't all reconnect together.
- **Pooler -> database**: much longer, so most application reconnects reuse an existing backend. Also with jitter.

Up until now we've assumed that each application connection uniquely owns a backend connection. What if we could decouple these?

## Pooling mode

Enter: pooling modes. There are several modes a pooler could operate in, each with different trade-offs. Here are the ones PgBouncer supports (see [its documentation](https://www.pgbouncer.org/features.html) for more details):

- **Session pooling** – Each client connection gets a dedicated backend connection for the duration of the session. What we've been discussing until now.
- **Transaction pooling** – Each client connection gets a backend connection only for the duration of a transaction. Once the transaction completes, the backend connection is returned to the pool and can be used by other client connections.
- **Statement pooling** – Each client connection gets a backend connection only for the duration of a single SQL statement. Once the statement completes, the backend connection is returned to the pool and can be used by other client connections.

Let's assume we want to run transactions, so statement pooling is out of scope.

It seems transaction pooling could help solve our problems! When not actively in use, client connections don't hold onto backend connections, allowing the pooler to efficiently share a smaller number of backend connections among many clients.

{% include diagram.html
  name="pool-patterns-wiring-pooler-local-txn"
  alt="Three applications, each with a local pool of two connections to the pooler. Two connections are in use and four are idle. Inside the pooler, only the two in use are wired to database connections. The pooler also keeps one idle database connection spare, not wired to any client, so the database has three backends."
  caption="Local pools through a pooler using transaction pooling: idle connections (dashed) don't hold a backend, and one spare is shared by everyone"
%}

{% include diagram.html
  name="pool-patterns-transaction"
  alt="A timeline of two backends running the same transactions from client connections A, B and C. Each transaction takes whichever backend is free, so A's third transaction runs on backend 2 after its first two ran on backend 1."
  caption="Transaction pooling: the same transactions need only two backends, but a client connection's transactions can run on different backends"
%}

The trade-off, of course, is that certain operations which rely on session state, like setting configuration parameters, temporary tables, or session-level advisory locks, don't work correctly with transaction pooling. If your application needs these features, you're stuck with session pooling.

## Summary

Putting it all together, we end up with a bunch of options. "Direct, per request" is there mainly as a baseline for comparison. I wouldn't really recommend it.

<div class="table-wrapper" markdown="block">

| | Fast acquisition | Few backend startups | Few backends | No extra component | Full session state |
| --- | --- | --- | --- | --- | --- |
| **Direct** | | | | | |
| Per request | ❌ | ❌ | ✅ | ✅ | ✅ |
| Local pool | ✅ | ⚠️ Except on cold starts | ❌ | ✅ | ✅ |
| **Session pooling** | | | | | |
| Per request | ❌ | ✅ | ✅ | ❌ | ✅ |
| Local pool | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Transaction pooling** | | | | | |
| Local pool | ✅ | ✅ | ✅ | ❌ | ❌ |

</div>

Whichever option we choose, we'll be making some trade-offs:

- **Direct, with a local pool** is the simplest, and works fine as long as you don't run too many replicas, and the database can cope with cold starts.
- **A pooler without local pools** makes sense when applications can't keep a pool, e.g. serverless functions or short-lived processes. Without a pooler, you're paying for a new connection and backend on every request.
- **Session pooling with local pools** mostly just protects the database from cold starts. You still have as many backends as pooled connections.
- **Transaction pooling with local pools** is the only option with both fast acquisition and few backends. The cost is running poolers, and giving up session state. It's most worth it when you run many more application replicas than poolers.
