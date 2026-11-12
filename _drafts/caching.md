---
layout: post
title: "Caching"
tags: [caching, reliability, distributed systems]
---

I've had several experiences where it's been surprisingly hard to understand why a cache exists and what problem it's solving. Sometimes the reasons have been lost over time. Other times there is a known answer, but it doesn't hold up to scrutiny. When the reason is unknown, there can be a [reasonable reluctance](https://fs.blog/chestertons-fence/) to change or remove it.

I find it helpful to answer two questions before adding a cache (and writing the answers down): what's the problem, and why is it worth solving? The answers also shape most of the design decisions that follow.

## Reasons to cache

A cache sits in front of some **source** of data: a database, another service, a third-party API.

The first question is: what's the problem? Examples:

- **Availability** – the source could take you below your availability SLO. This either is likely, has been seen in practice, or has significant impact if it does happen.
- **Latency** – the source is too slow to meet your latency SLO.
- **Load** – the source is reaching capacity limits and you need to reduce the number of requests it receives. Overloading it would increase latency and/or reduce availability (this is sort of _availability_ and _latency_ in disguise, but I think it's worth calling out anyway).
- **Cost** – the source is exceeding your infrastructure budget.

Notice that these tend to mention quantifiable metrics such as SLOs, capacity, and budget.

The second question is: why is it a real problem worth solving?

For example, caches can decrease latency in some cases. But if you have a latency SLO and you're well within it, then latency isn't a real problem and a cache isn't needed to improve it. If you are doing fairly simple reads, e.g. a lookup by ID, then adding a cache might not significantly improve latency anyway.

Similarly, if your database can easily handle the load (or could by simply using a bigger machine), then perhaps load isn't really a problem worth solving either. Of course, if it's simply too expensive to use a big enough database for your reads then you might want to offload onto a cache (assuming your cache is cheaper to run). By fixing the _cost_ problem (with a smaller database) you've introduced a _load_ problem.

{% include callout.html
  type="aside"
  content="\"Too expensive\" should probably be quantified. It invites the question \"_how_ expensive is too expensive?\". Same with \"too slow\" or \"too much load\". What is your budget/SLO/capacity, and what is your utilisation? Without this, you don't know if you have a real problem or a made up problem. (OK OK, SLOs can be made up, but hopefully they're a proxy for _something_ meaningful to your business/product/system.)"
%}

Once you know the problem, you can frame the goal:

- **Increase availability** – by returning (potentially stale) data even when the source is unavailable.
- **Reduce latency** – by turning an expensive operation into a fast lookup of a previously computed value.
- **Reduce load** – by reducing the number of (potentially expensive) operations on the source.
- **Reduce cost** – by reducing the number of _billable_ operations on the source.

When you use a cache, it should be clear which of the above goals you're optimising for. These can overlap in practice – a cache that reduces load will often also reduce latency. There can be more than one, but it's generally simpler to just focus on a single primary goal.

## Design

Once you've figured out what problem(s) you're solving and therefore your goal(s), you can start to make design decisions. The goal will tend to dictate the shape of the cache, and the trade-offs you're willing to make.

Let's take a look at a few common design decisions you might need to make.

### Local vs. remote

There are several factors which will influence this decision (e.g. size of the dataset), but one relevant to the above goals concerns the effect of cold starts. Local (in-process) caches empty whenever the process restarts. This means increased cost, latency, or load on the source while the cache warms up, as well as exposure to the source's availability.

The worst case is when you're optimising for load because the source can't handle the full traffic, and _all_ of your instances restart at the same time, taking down the source. This is a [metastability](https://brooker.co.za/blog/2021/05/24/metastable.html) [issue](https://brooker.co.za/blog/2021/08/27/caches.html). A remote cache avoids this for deploys, but doesn't remove the problem entirely: if the cache cluster itself restarts or loses its data, the source gets the full load.

If your goal is availability, then this is perhaps less of a concern, assuming periods of unavailability are rare and short-lived, and restarts are infrequent. Even if a subset of processes restart during the outage, the others can still serve cached values.

### Client-side vs. server-side

This is related to local vs. remote, but it's a different question: who owns the cache? A server-side cache belongs to the service that owns the data. A client-side cache belongs to the service calling it. Either one could be local or remote.

Which one you want depends on where the problem is.

For availability, it depends what you're protecting against. If it's the service's database going down, the service can cache in front of its own database, and every caller benefits without having to do anything. If it's the service itself becoming unavailable, a cache inside it won't help. The caller needs its own cache.

For load and cost, the expensive part is usually behind the service: a database query, a billable third-party API call, some expensive computation. Caching server-side, next to the expensive thing, fixes it for every caller at once. Occasionally though, it's the service itself that's struggling, e.g. it's running out of CPU just handling the volume of requests. A server-side cache won't help much there, because every request still has to reach the service. Caching in the callers means those requests are never sent.

Latency is similar. A server-side cache removes the slow work behind the service, but not the caller's round trip to the service. If that round trip is the problem, only a client-side cache will remove it, and only if there's a smaller round trip time to the cache (or none at all). A round trip within a datacentre should be less than a millisecond, so unless your latency SLO is very tight (or you're making lots of calls in series), it's probably noise.

The downside of client-side caches is that the owner of the data has no control over them. It can't easily invalidate them, and might not even know they exist.

### Staleness and invalidation

Unlike the decisions above, staleness tolerance isn't decided by the goal. It depends on the data, and what you're using it for. This blog has a high staleness tolerance, but information about an in-progress payment does not. It's worth asking: how stale can this data be before it causes a real problem?

There are two ways to decide that a cached entry is no longer valid: time or events. With a TTL, an entry expires a fixed time after it was cached, whether or not the data has changed. With events, an entry is invalidated when the data changes.

They give you different guarantees. A TTL puts a hard limit on staleness, but you'll refetch data that hasn't changed, and serve data that has changed for up to the full TTL. Events usually keep data much fresher, but there's no limit: if an event gets lost, the entry stays stale until something else removes it.

Events also aren't always an option. You need to:

- **See changes happen** – either you own the data, or its owner publishes change events.
- **Know which entries a change affects** – not always possible, e.g. if your keys are built from search parameters.
- **Reach every copy of the cache** – much harder once there are many of them (a local cache in every instance, or a client-side cache in every caller).

If any of these doesn't hold, a TTL is your only option. Even when they all do, I'd still use a TTL as a backstop.

That leaves the question of how long the TTL should be. A long TTL results in fewer cache misses, so less load and cost, and the cache can keep serving for longer if the source becomes unavailable, but the data gets staler. A short TTL keeps the data fresh, but more requests go to the source, and the cache empties quickly during an outage.

If your goal is availability, you can get some of the advantages of both with [`stale-if-error`](https://datatracker.ietf.org/doc/html/rfc5861#section-4). Use a short TTL, but when an entry expires, keep the old value until you've fetched a new one. If the fetch fails, keep serving the stale value (and keep retrying in the background).

This means refreshing entries in place rather than removing them. If your cache deletes entries on expiry, you'll need to store your own refresh time alongside the value, and set the cache's expiry to the longest you'd tolerate serving stale data during an outage.

This doesn't help with load or cost, though. Traffic to the source is still driven by the short TTL. If that's your goal, a longer TTL (plus events, if you need fresher data) is a better fit.

## Summary

This isn't a complete guide to cache design. You'll still need to think about things like eviction (removing items when the cache is full), whether invalid entries are removed or refreshed in place, key design, and [caching strategies](https://hld.handbook.academy/trade-offs/cache-strategies/). But hopefully this gives you a framework for making some of the key decisions about caching in your system.

Before adding a cache, write down the problem it's solving, with a number attached: the SLO it protects, the capacity limit it keeps you under, or the budget it keeps you within. If you can't do that, I'd question whether you need the cache at all. If you can, it'll guide most of the design decisions, and the next person to look at the system will know why the cache is there.
