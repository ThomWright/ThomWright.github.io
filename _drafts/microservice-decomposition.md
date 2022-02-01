---
layout: post
title: Decomposition in microservice architectures
---

This article is an adaptation of some advice I've written over the years about designing microservice architectures. There isn't much novel advice here, it's mainly just existing ideas rehashed in my own words. It's largely based on real-world problems I've encountered or discussed, but I don't claim to be an expert. This is an attempt to get some ideas out of my head and written down to more easily share and discuss them. The intended audience was full-stack Node.js engineers with varying amounts of experience.

Deliberately out of scope are aspects such as monitoring, deployment, or database choices. It's assumed that these kinds of decisions have already been made and implemented. Instead, it's mainly aimed at answering a class of question I hear a lot, which is (in essence):

> How do I decompose an application (or set of features) into one or more microservices?

I make liberal use of the word "should" where I think the advice is generally applicable, but people can disagree and it is likely to depend on context. Also, many of the guidelines are _engineering ideals_, where aiming for 100% adherence will probably make things worse!

## What are microservices?

I'm defining service in this context as a software application, accessible over a network. That's pretty much it. For example, it could be:

- an HTTP server hosting a static website
- a worker processing messages from a [Kafka](https://www.gentlydownthe.stream/) topic
- a Java application with a [SOAP](https://en.wikipedia.org/wiki/SOAP) API
- an entire web application, e.g. Twitter

You'll often hear the term "microservices" used in opposition to "a monolith". In the context of web applications, a monolith is a pattern where all (or most) of an application's functionality is in a single unit. For example, a single Node.js application, a Laravel (PHP) web app, or a Java WAR file. For more detail see: [Pattern: Monolithic Architecture](https://microservices.io/patterns/monolithic.html).

Instead of designing applications as monoliths, they could instead be broken down into multiple, independent services. There are many pros and cons of doing so. Which architecture is better depends heavily on context. For more detail see: [Pattern: Microservice Architecture](https://microservices.io/patterns/microservices.html).

## Dependencies

I often think about decomposing microservice architectures in terms of dependencies, and nearly all the advice here relates to dependencies in some way.

There are many ways to define a dependency. I’ll be using two main criteria here:

1. A depends on B if when B changes, A must also change
2. A depends on B if it has _some knowledge_ of B

_Some knowledge_ can mean a bunch of things, for example it might be that service A knows B exists, how to contact B and what API B exposes. Generally A will contain some explicit reference to B or B's API in the source code. Honestly, this can be considered a subset of the first criteria, but I talk so often about services "knowing about each other" that it helps to call it out explicitly.

Probably the most common dependency relationship is when A sends HTTP requests (or similar) to B. In this case A knows about B and if B's HTTP API changes then we might need to change A.

These dependency relationships are closely related to the ideas of coupling and cohesion. You might often hear that services (or any kind of module) should have "high cohesion, and low coupling to other services".

Kent Beck has [a good talk discussion coupling and cohesion](httpes://hackmd.io/@pierodibello/Continued-Learning-The-Beauty-of-Maintenance---Kent-Beck---DDD-Europe-2020) with relevant definitions which I'll use here too:

- **Coupling** - A and B are coupled with respect to a particular change if changing A implies changing B.
- **Cohesion** - If I have an element E that have sub-elements, that element is cohesive to the degree that its sub-elements are coupled, meaning that if I have to change one of these sub-elements, I have to change the others sub-elements at the same time too.

Notice the strong similarity between the "coupling" and "dependency" definitions.

With these in mind, let's go through some guidelines.

One of the overarching guidelines here is to **make services easy to change**. Change is (often) inevitable, however we generally don't know _how_ we will need to change our services in the future. There are a number of general principles we can follow to make this easier.

**Minimise the number of dependency relationships**. The more X's that depend on Y, the harder Y is to change. Note that this goes for services, classes (or other modules of code), third party SaaS products, and pretty much anything else. If we want something to be easy to change, we should reduce the number of places in which we interact with it.

Not only do dependency relationships make it hard to make changes, they also open up new failure modes. Every service that X depends on can potentially contribute to breaking the functionality in X, and hence every service that depends on X. **Services should be resilient to their dependencies failing**.

Services do have to depend on each other at some point, they will not be completely independent. That said, we need to **be careful where we introduce new dependencies**. We have several strategies for reducing these relationships.

I generally like the idea of trying to **structure service dependencies as a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph)** (DAG) - and discouraging circular dependencies. This helps avoid high coupling between services. If you have a circular dependency between two services, consider whether their domains are tightly coupled enough that they should be consolidated into a single service. Also, if a circular dependency is making it hard to **independently deploy your services**, then strongly consider fixing it.

As a consequence, **services should know nothing about their clients**. For example, if your `internal-x` service knows anything about one of its clients named `client-service-y` then something has gone wrong. If the name `client-service-y` appears anywhere in the `internal-x` codebase, then it's an indicator that it knows too much. Even the existence of client services should be hidden. This means no special logic to change behaviour based on who is making the request.

**Isolate third party dependencies behind a single service**. This makes changing and auditing integrations with external systems much easier. Note that "changing" here doesn't necessarily mean swapping out the third party service for another. It might just mean, for example, improving monitoring or upgrading to the latest version of their API (e.g. for security fixes).

**Don't expose internal implementation details**. There are several aspects of this, discussed further below. This goes for individual services (e.g. data structures, processes, which database they use, even which languages they're written in), and also our architecture at a higher level from a public point of view (e.g. the fact that we use microservices, what services which have, what they're called, APIs of internal services).

**Services should only communicate over their APIs**, whether that be HTTP APIs, Pub/Sub messages or something else. Avoid using shared storage, e.g. databases or file systems. As with most of this advice, there will be exceptions; in this case large files might be transferred using a shared cloud storage, e.g. an S3 bucket.

Related to the above, consider implementing a **one-to-one service-to-database mapping**, which ensures each service's internal storage is logically isolated. In OO terms, **consider database structures to be private state**. Services should never connect to another service's database. In some cases a service might use multiple databases (one-to-many), but importantly they should be private (i.e. not many-to-one).

**Don't expose internal services**. It should be possible to evolve internal APIs without breaking external clients. Use dedicated public API services for exposing APIs publicly. This makes it easy to audit what is exposed, and makes it clear which APIs need to be kept backwards-compatible.

**API stability is tiered**. Some services are inherently difficult to change. For example, if they are depended on by a mobile app where years-old versions are still in use, or central internal services which are depended on my many other services. In general, external APIs should have the highest levels of stability. Private databases should (in theory!) be the most flexible, since they should only have a single internal client. Database migrations will still need to be backwards compatible, and might need to be done in several steps.

**Store environment-specific configuration separately**. This is slightly different to the service-to-service dependencies we've been discussing above, but the advice applies just as well.

As an example, services are likely to be running in several environments, e.g. staging and production. Assuming you are defining your infrastructure declaratively somehow, it's likely you'll have some configuration for these environments somewhere, which will include which services should run and which versions of those services. In other words, the production environment knows about your service, and has a dependency on it. If the service codebase includes the configuration for a specific environment, then the service also knows about the environment, which is then a circular dependency.

In practice, this means the environment and service are _coupled with respect to configuration changes_. If we want to change a log level, we would need to change that in the service, build a new version, then change the service version in the production environment.

However, if we keep environment-specific configuration out of the service, then it means we can change this log level without having to change the service itself, or rebuild it. See [The Twelve-Factor App - Config](https://12factor.net/config) for a deeper discussion of this concept.

In truth, a lot of this advice about dependencies and coupling isn't just for microservices, it's generally applicable for many situations.

## Decomposition

There are other aspects to consider when decomposing services, both when splitting up existing services and designing new ones. I'll discuss a few here.

Consider the high level **business context** of the proposed service(s). I find this one hard to discuss without concrete examples, but if services are handling very different parts of the business then it's easier to justify splitting them.

You might also hear the related term **bounded context**. If you can design two services such that they have private, internal representations/models which only they know about and are not shared with other services, then that's a good sign.

Related to business context, consider **team alignment and Conway's Law**. Teams should be aligned around business contexts rather than technical groupings (e.g. API layer, database layer). Your services should map reasonably well to this structure.

Also consider **transactional boundaries and data consistency**. Splitting up services involves splitting the data in these services, and this can lead to data inconsistency. Sometimes eventual consistency can be acceptable, but generally splitting things up can increase the risk not not-even-eventual consistency. This is partly due to losing the atomic, transactional nature of (some) databases. It is important to be aware of where this is and isn't acceptable, and the trade-off being made. If you need to make atomic changes to a set of data, then try to group this inside a single service.

Note that none of these are "size". Generally this is a proxy for other problems associated with the size, e.g. poor modularity, independent deployment or scaling.

This is by no means an exhaustive list. I haven't said much about scaling or independent deployability for example, but it's a start.

## Further reading

- [Building Microservices](https://samnewman.io/books/building_microservices/)
- [A pattern language for microservices](https://microservices.io/patterns/index.html)
- [Best Practices for Building a Microservice Architecture](https://www.vinaysahni.com/best-practices-for-building-a-microservice-architecture)
