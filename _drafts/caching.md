---
layout: post
title: "Caching"
tags: [caching, reliability, distributed systems]
---

When I come across a cache in a system, I often find it surprisingly hard to get a clear answer to why it's there and what problem it's solving. Sometimes the reasons have been lost over time: the person who added it has moved on, or the system has changed around it.

Other times there is an answer, but it doesn't hold up to scrutiny.

Most of this can be avoided by answering two questions before adding a cache (and writing the answers down): what's the goal, and why is it a real problem worth solving? The answers also shape most of the design decisions that follow.

## Reasons to cache

The first question is: what's the goal? Possible goals for a cache include:

- **Increase availability** — by returning (potentially stale) data even when a system you depend on is unavailable
- **Reduce latency** — by turning an expensive operation into a fast lookup of a previously computed value
- **Reduce load** — by reducing the number of (potentially expensive) operations on a system
- **Reduce cost** — by reducing the number of _billable_ operations on a system

When you use a cache, it should be clear which of the above goals you're optimising for. These often overlap in practice — a cache that reduces load will often also reduce latency. There can be more than one, but it's often simpler to just focus on a single primary goal.

The second question is: why is it a real problem worth solving?

For example, caches can decrease latency in some cases. But if you have a latency SLO and you're well within it, then latency isn't a real problem and a cache isn't needed to improve it. If you are doing fairly simple reads, e.g. a lookup by ID, then adding a cache is unlikely to significantly improve latency anyway.

Similarly, if your database can easily handle the load (or could by simply using a bigger machine), then perhaps load isn't really a problem worth solving either. Of course, if it's simply too expensive to use a big enough database for your reads then you might want to offload onto a cache (assuming your cache is cheaper to run). By fixing the _cost_ problem (with a smaller database) you've introduced a _load_ problem.

{% include callout.html
  type="aside"
  content="\"Too expensive\" should probably be quantified. It invites the question \"_how_ expensive is too expensive?\". Same with \"too slow\" or \"too much load\". What is your budget/SLO/capacity, and what is your utilisation? Without this, you don't know if you have a real problem or a made up problem. (OK OK, SLOs can be made up, but hopefully they're a proxy for _something_ meaningful.)"
%}

So, first define the problem. Examples:

- **Availability** — the system you depend on could take you below your availability SLO. This is either likely, or has significant impact if it does happen.
- **Latency** — the system you depend on is too slow to meet your latency SLO.
- **Load** — the system you depend on is reaching capacity limits and you need to reduce the number of requests it receives. Overloading it would increase latency and/or reduce availability (this is sort of _availability_ and _latency_ in disguise, but I think it's worth calling out anyway).
- **Cost** — the system you depend on is exceeding your infrastructure budget.

Notice that these tend to mention quantifiable metrics such as SLOs, capacity, and budget. Of course, you could just make up an SLO, but it _should_ be based on _something_ reasonable like user experience. Something meaningful to your business/product/system.

## Design

Once you've figured out what problem(s) you're solving and therefore your goal(s), you can start to make design decisions. The goal will often dictate the shape of the cache, and the trade-offs you're willing to make.

Let's take a look at a few common design decisions you might need to make.

**Local vs. remote.** There are several factors which will influence this decision (e.g. size of the dataset), but a relevant one for us concerns the effect of cold starts. Local (in-process) caches empty whenever the process restarts. This means increased cost, latency, or load on the source system while the cache warms up, as well as exposure to source system availability.

The worst case is when you're optimising for load because the source system can't handle the full traffic, and _all_ of your instances restart at the same time, taking down the database. This is a [metastability](https://brooker.co.za/blog/2021/05/24/metastable.html) [issue](https://brooker.co.za/blog/2021/08/27/caches.html). A remote cache avoids this for deploys, but doesn't remove the problem entirely: if the cache cluster itself restarts or loses its data, the database gets the full load.

If your goal is availability, then this is perhaps less of a concern, assuming periods of unavailability are rare and short-lived, and restarts are infrequent. Even if a subset of processes restart during the outage, the others can still serve cached values.

---

**Client-side vs. server-side.** This is related to local vs. remote, but it's a different question: who owns the cache? A server-side cache belongs to the service that owns the data. A client-side cache belongs to the service calling it. Either one could be local or remote.

Which one you want depends on where the problem is.

For availability, it depends what you're protecting against. If it's the service's database going down, the service can cache in front of its own database, and every caller benefits without having to do anything. If it's the service itself becoming unavailable (a bad deploy, overload, the process falling over), a cache inside it won't help. The caller needs its own copy.

For load and cost, the expensive part is usually behind the service: a database query, a billable third-party API call, some expensive computation. Caching server-side, next to the expensive thing, fixes it for every caller at once. Occasionally though, it's the service itself that's struggling, e.g. it's running out of CPU just handling the volume of requests. A server-side cache won't help much there, because every request still has to reach the service. Caching in the callers means those requests are never sent.

Latency is similar. A server-side cache removes the slow work behind the service, but not the caller's round trip to the service. If that round trip is the problem, only a client-side cache will remove it. That said, I'd be surprised if it _is_ the problem, at least with the systems I've worked with. A round trip within a datacenter is usually a few milliseconds at most, so unless your latency SLO is very tight (or you're making lots of calls in series), it's probably noise.

The downside of client-side caches is that the owner of the data has no control over them. It can't easily invalidate them, and might not even know they exist.

**How much staleness can you tolerate?** Unlike the decisions above, this one isn't decided by the goal. It depends on the data, and what you're using it for. A product description, a feature flag, and an account balance all have different tolerances for being wrong, regardless of why you're caching them. So work this out separately: how long can this value be out of date before it causes a real problem?

**Invalidation.** There are two ways to trigger invalidation: time or events. A TTL is time-based: after a fixed period, the entry is considered stale and gets refreshed from the source. Event-based invalidation removes an entry when the data changes.

Events give you fresher data, but they're not always an option. You need to:

- **See changes happen** — either you own the data, or its owner publishes change events
- **Know which entries a change affects** — not always possible, e.g. if your keys are built from search parameters
- **Reach every copy of the cache** — much harder once there are many of them (a local cache in every instance, or a client-side cache in every caller)

If any of these doesn't hold, a TTL is your only option. Even when they all do, I'd still use a TTL as a backstop, because events can get lost.

A good test is to ask what you'd do if a cached value was wrong right now. If the answer is "wait for the TTL to expire", is that OK? For a product listing, probably. For anything to do with security or money, probably not, and you'll want an explicit invalidation path.

That leaves the question of how long the TTL should be. A long TTL means more cache hits, so less load and cost, and the cache can keep serving for longer if the source becomes unavailable. But the data gets staler, and past a certain point you'll need to add event-based invalidation to keep it fresh enough. A short TTL keeps the data fresh, but more requests go to the source, and the cache empties quickly during an outage.

If your goal is availability, you can get some of both with [`stale-if-error`](https://datatracker.ietf.org/doc/html/rfc5861#section-4). Use a short TTL, but if a refresh fails, keep serving the stale value (and keep retrying in the background). This works if you really have two tolerances for staleness: how stale is acceptable in normal operation, and how stale is acceptable when the source is down.

This doesn't help with load or cost, though. Traffic to the source is still driven by the short TTL. If that's your goal, a longer TTL (plus events, if you need fresher data) is a better fit.

This isn't a complete design. You'll still need to think about things like eviction, key design, and thundering herds. But hopefully this gives you a framework for making some of the key decisions about caching in your system.

## Summary

Before adding a cache, write down the problem it's solving, with a number attached: the SLO it protects, the capacity limit it keeps you under, or the budget it keeps you within. If you can't do that, I'd question whether you need the cache at all. If you can, it'll guide most of the design decisions, and the next person to look at the system will know why the cache is there.
