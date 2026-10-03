---
title: "Connection pools: patterns"
layout: post
tags: [databases, postgresql, connection pooling, performance, patterns]
---

I've [previously discussed]({% post_url 2026-02-21-local-vs-shared-pool %}) how using local vs shared connection pools can significantly change the number of open connections to your database. This isn't the only consideration, so this post will go more in depth on different patterns and their trade-offs.

Let's start by looking at the full cost of establishing a connection to a database, taking PostgreSQL as an example.

{% include callout.html
  type="aside"
  content="PostgreSQL is what I'm most familiar with. Different databases will vary on some details, but the concepts should still apply."
%}

The following assumes you're using [SCRAM-SHA](https://www.postgresql.org/docs/18/auth-password.html#AUTH-PASSWORD) as the authentication method.

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

Without a pool, we need to establish a new connection every time (let's assume once per request). This adds request latency, as well as load on the database (and the client, if the auth is expensive).

{% include diagram.html
  name="pool-patterns-direct-local"
  alt="Three application processes, each with its own pool, connecting to the database."
  caption="Connecting directly to the database: through a local pool"
%}

{% include diagram.html
  name="pool-patterns-seq-direct-local"
  alt="A sequence diagram of one request. The application sends a query to the database and gets rows back, with no connect step."
  caption="With a warm pool, a request goes straight to its query"
%}

With a pool, most of the time when we request a connection we'll get an existing one, so no round trips to the database, no auth etc. The trade-off is a higher number of connections, which [scales badly]({% post_url 2026-02-21-local-vs-shared-pool %}) with respect to the number of application replicas. This is especially bad for PostgreSQL, where each connection is a separate process with its own memory.

There are also potential metastable/thundering herd issues, where when an application restarts, it will have a cold pool and potentially need to establish many connections concurrently. If the database is sized for the load with warm pools, this can overload it, like a cold cache. Connections get slower, short timeouts fire, and retries create even more connections, so the database might not recover.

To solve these problems, what if we introduced a shared connection pooler? We then have another decision to make: do we want to keep our local application pool, or offload pooling entirely to the pooler?

## Adding a shared pooler

{% include diagram.html
  name="pool-patterns-pooler"
  alt="Three application processes connect to a shared pooler, which connects to the database."
  name_2="pool-patterns-pooler-local"
  alt_2="Three application processes, each with its own pool, connect to a shared pooler, which connects to the database."
  caption="Connecting through a pooler, without and with local pools"
%}

{% include diagram.html
  name="pool-patterns-seq-pooler"
  alt="A sequence diagram of one request through a pooler, without a local pool. The application connects to the pooler, which takes six round trips plus hashing, but nothing reaches the database. Then the query goes to the pooler, which forwards it to the database, and the rows come back the same way."
  caption="Per request through a pooler: the client still pays to connect, but the database doesn't"
%}

{% include diagram.html
  name="pool-patterns-seq-pooler-local"
  alt="A sequence diagram of one request through a pooler, with a local pool. The query goes to the pooler, which forwards it to the database, and the rows come back the same way."
  caption="A local pool through a pooler: no connect, but every query takes the extra hop"
%}

...

{% include diagram.html
  name="pool-patterns-poolers"
  alt="Four application processes, any of which can connect to either of two poolers. Both poolers connect to the database."
  caption="Several applications sharing several poolers"
%}

{% include diagram.html
  name="pool-patterns-session"
  alt="A timeline of three backends. Each is held by one client connection, A, B or C, for the whole time, including while the connection is idle between transactions."
  caption="Session-pinned: each client connection (A, B, C) holds a backend for its whole life, even while idle between transactions"
%}

## Pooling mode

{% include diagram.html
  name="pool-patterns-transaction"
  alt="A timeline of two backends running the same transactions from client connections A, B and C. Each transaction takes whichever backend is free, so A's third transaction runs on backend 2 after its first two ran on backend 1."
  caption="Per-transaction: the same transactions need only two backends, but a client connection's transactions can run on different backends"
%}

## Summary

| | Per request | Local pool |
|---|---|---|
| **Database** | 🔴 latency<br>🔴 database load | 🟢 latency<br>🔴 backends |
| **Pooler, session-pinned** | 🔴 latency<br>🟢 database load<br>🟢 backends<br>🟢 session state | 🟢 latency<br>🔴 backends<br>🟡 extra component<br>🟢 session state |
| **Pooler, per-transaction** | 🔴 latency<br>🟢 database load<br>🟢 backends<br>🟡 session state | 🟢 latency<br>🟢 backends<br>🟡 extra component<br>🟡 session state |

<div class="table-wrapper" markdown="block">

| | Connect latency | Database load | Backends | Extra component | Session state |
|---|---|---|---|---|---|
| **Database** | | | | | |
| Per request | 🔴 | 🔴 | 🟢 | 🟢 | 🟢 |
| Local pool | 🟢 | 🟢 | 🔴 | 🟢 | 🟢 |
| **Session-pinned pooler** | | | | | |
| Per request | 🔴 | 🟢 | 🟢 | 🟡 | 🟢 |
| Local pool | 🟢 | 🟢 | 🔴 | 🟡 | 🟢 |
| **Per-transaction pooler** | | | | | |
| Per request | 🔴 | 🟢 | 🟢 | 🟡 | 🟡 |
| Local pool | 🟢 | 🟢 | 🟢 | 🟡 | 🟡 |

</div>
