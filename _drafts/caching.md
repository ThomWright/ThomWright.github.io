---
layout: post
title: "Caching"
tags: [caching, reliability, distributed systems]
---

Too often, when I see a cache in a system, there seems to be a lot of confusion about why the cache exists and what problem it's solving. Almost as often, people _think_ they know why the cache is there, but the justification doesn't hold up to scrutiny.

## Reasons to cache

The first mistake I see is not being clear on the goal. Possible goals for a cache include:

- **Increase availability** — by returning (potentially stale) data even when a system you depend on is unavailable
- **Reduce latency** — by turning an expensive operation into a fast lookup of a previously computed value
- **Reduce load** — by reducing the number of (potentially expensive) operations on a system
- **Reduce cost** — by reducing the number of _billable_ operations on a system

When you use a cache, it should be clear which of the above goals you're optimising for. These often overlap in practice — a cache that reduces load will often also reduce latency. There can be more than one goal, but that might lead you into tricky design territory.

The second mistake I see is using a cache to solve something that isn't a real problem.

For example, caches can decrease latency in some cases, sure. But hopefully you have a latency SLO, and if your latency is well within that SLO then latency isn't a real problem and a cache isn't needed to improve it. If you are doing fairly simple reads, e.g. a lookup by ID, then adding a cache is unlikely to significantly improve latency anyway.

Similarly, if your database can easily handle the load (or could by simply using a bigger machine), then perhaps "load" isn't really a problem worth "solving" either. Of course, if it's simply too expensive to use a big enough database for your reads then you might want to offload onto a cache (assuming your cache is cheaper to run). By fixing the _cost_ problem (with a smaller database) you've introduced a _load_ problem.

{% include callout.html
  type="aside"
  content="\"Too expensive\" needs to be quantified. It invites the question \"_how_ expensive is too expensive?\". Same with \"too slow\" or \"too much load\". What is your budget/SLO/capacity, and what is your utilisation? Without this, you don't know if you have a real problem or a made up problem."
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

The worst case is when you're optimising for load because the source system can't handle the full traffic, and _all_ of your instances restart at the same time, taking down the database. This is a [metastability](https://brooker.co.za/blog/2021/05/24/metastable.html) [issue](https://brooker.co.za/blog/2021/08/27/caches.html).

If your goal is availability, then this is perhaps less of a concern, assuming periods of unavailability are rare and short-lived, and restarts are infrequent. Even if a subset of processes restart during the outage, the others can still serve cached values.

---

**Client-side vs. server-side.** Related but different from local vs. remote: not where the cache's storage lives, but who owns it relative to the source of truth. This one isn't decided by the goal alone — it's decided by _where the problem actually is_.

For availability, ask what you're protecting against. If it's the database going down, the service sitting in front of it can absorb that itself — a cache there benefits every caller, none of whom need to know the database exists. If it's that service itself becoming unreachable — a bad deploy, a capacity issue, the process falling over — a cache inside it doesn't help the caller at all. The caller needs its own copy, which means client-side.

Load, cost, and latency all come down to the same question: is the constraint downstream of the request, or is it the request itself?

Usually it's downstream — a slow database query, a paid third-party call, an expensive computation. Cache that server-side, next to the thing that's slow or expensive, and every caller benefits without needing to know it's there.

Sometimes, though, the constraint is the request arriving at all. A high enough rate of requests can saturate connection handling or ingress capacity independent of how cheap each one is once it lands — a server-side cache doesn't help here, since you still have to receive and route every request before you can even check it. If the request itself is the bottleneck, the cache has to live in the caller, so the request is never sent.

Latency has the same split. If the round trip is what's expensive, not the work happening on the server, a server-side cache doesn't remove that cost — you've just swapped a round trip to a database for a round trip to a cache.

Worth checking whether any of this is a real problem before reaching for a client-side cache, though — the "solving a non-problem" mistake again, in a more specific form. A single round trip within a datacenter is often a few milliseconds. If your latency SLO is, say, P99 < 150ms, that round trip is probably noise.

One consequence of client-side placement comes for free either way: it can't be centrally invalidated, since it's scattered across every replica of every caller and the data's owner has no way to reach in and clear it. Fine when staleness is already the accepted trade-off — less fine if you've picked client-side and then discover the data needs to stay fresh after all.

**How much staleness you can tolerate.** Unlike the two decisions above, this one isn't something the goal decides for you. It comes from the data itself, and whatever depends on it — a certificate, a feature flag, and an account balance all have different tolerances for being wrong, regardless of why you're caching them. So work it out independently, before you touch the cache design: how long can this specific value be wrong before that's actually a problem?

Where the goal comes back in is invalidation. A centralised, server-side cache can usually support explicit invalidation — clear the entry the moment the data changes. A client-side or local cache, once you've accepted the local/remote and client/server trade-offs above, usually can't — there's no single place to reach into and clear every replica. So the goal constrains which invalidation strategies are even on the table, and your job is to check that the tolerance you worked out actually fits inside what's achievable. If the data can't tolerate the staleness a TTL-only cache implies, you need a shorter TTL, a different cache placement, or to accept that caching isn't the right tool here.

The emergency case is a good test of this. If a cached value turns out to be wrong right now — poisoned, rotated, simply out of date — how do you fix it? If the only invalidation strategy is a TTL, the answer is "wait for it to expire." That's fine for a listings page. It's not fine for anything security- or money-adjacent, where you need either an explicit invalidation path or a TTL short enough that "wait" is genuinely acceptable.

None of this produces a finished design on its own — eviction policy, key structure, thundering herds, and schema compatibility are all still open. But each of those becomes a narrower, more concrete question once the goal is fixed, rather than a fresh set of guesses.

## Two examples

**A listings endpoint, hit on every page load, backed by a database whose read replicas are pinned near capacity at peak traffic.** That's a load problem, quantified: capacity is close to a real limit, not just "feels like a lot of queries." The goal is load, and that points fairly directly at a remote cache — the saving needs to hold across every instance, and survive a deploy without a cold-start spike landing on the database at the worst possible moment. The query parameters that build the listing mean there could be a large number of distinct cache keys, so explicit invalidation per entity isn't realistic; a TTL is the only option on the table. Separately, the underlying data barely changes — the listing's own tolerance for staleness is loose, so a TTL-only invalidation strategy comfortably fits inside it.

**A downstream lookup — credentials, configuration, whatever — needed on the hot path of every request, where the dependency's own availability is good but not good enough to bet the caller's uptime on directly.** The goal is availability, not load — there's no volume problem on the dependency, just an unacceptable amount of shared fate. That points to a local, client-side cache with a short TTL: local, because a cold cache after a deploy isn't the failure mode being defended against; client-side, because the goal is the caller's resilience, not the dependency's database. As before, that placement means invalidation can only be TTL-based — so it's worth checking separately that a short TTL is actually tolerable for this data. Credentials that rotate infrequently usually are; a value that must never be served after it changes would not be. Pair it with [stale-while-revalidate](https://web.dev/articles/stale-while-revalidate) — keep serving the last known value while retrying in the background — so a slow or unavailable dependency degrades to "slightly stale" instead of "broken."

These two land on nearly opposite designs — remote vs. local, generous staleness vs. a short TTL kept deliberately tight — despite both being, on the surface, "a cache in front of something slow." The goal decides the shape; the data decides whether that shape actually works.
