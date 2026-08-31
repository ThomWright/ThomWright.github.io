---
title: "Cohesion and Coupling"
layout: post
---

Two concepts I wish more software engineers spent more time thinking about are cohesion and coupling. A lot of the job is making decisions about how to break up a system into components, whether this be classes, modules, services, or even teams. It's not always obvious how to do this, but thinking in terms of cohesion and coupling can help.

**Coupling** is a measure of how dependent one component is on another. If a change in one component requires changes in another, they are tightly coupled. If a change in one component has little to no effect on another, they are loosely coupled.

It is generally helpful to explicitly say _how_ two components are coupled. For example, if a client sends a request to server, they are coupled with respect to the API of the server.

**Cohesion** is the degree to which the parts within a component depend on each other. If the parts of a component generally change together, but not with other components, it is highly cohesive.

A common example of low cohesion modules are `helpers/`, `utils/` or `common/` directories. These are often a grab bag of unrelated functions. When your date/time utility functions need to change, do your string utility functions also need to change? Hopefully not. They should be unrelated.

Generally, we want to maximise cohesion and minimise coupling.

When it comes to code, a common case where this comes up is _layering_. For example, a service may have a data access layer, a business logic layer, and an API layer. Each of these layers will likely need to represent some business entity, e.g. user. A design choice which needs to be made is: should the user model/struct/class/whatever be shared across layers, or should each layer have its own model?

The answer, of course, is "it depends". If the layers _can_ use the same representation, then maybe that's fine. But as soon as you need to represent it differently in one layer, e.g. a separate read model and write model for the data access layer, then you have a coupling problem. You've coupled your API and business logic layers to the data access layer with respect to how they model a user. At this point, you want to change them independently, so you want to decouple them.

I have been asked before "why do we have three different models for `User` in this service? Aren't they the same thing? Can't we combine them into one? Doesn't this violate DRY?" And sure, they all represent the same real-world concept, but they are not the same thing. They can, and often do, change independently for different reasons.

The problem with DRY is that it masquerades as a simple, generally applicable principle, whereas in reality it requires a lot of context to apply correctly. It's too easy to see two similar procedures or structures and declare that they violate DRY without any real justification of why it's a significant problem. But the questions we should be asking are: do these two things change for the same reasons? If we consolidated them, would it make some things harder to change independently? Is that a significant problem or not, and if so, why? Copying and pasting code is not necessarily bad. But coupling with respect to things that are likely to change a lot _is_ likely to be a problem.

Now don't get me wrong, it's possible to go too far with this layering example. If you have a simple service where a single model would be fine, then having one or more models for each layer (plus models for communicating between the layers) means you are likely over-engineering. But if you have a complex service where the models are changing independently, then having separate models is likely a defensible choice.

While we're on the topic of service layers, let's talk about package-by-layer vs package-by-feature. Package-by-layer is where your top-level directories are the layers, e.g. `api/`, `logic/`, and `database/`, and each of these directories has subdirectories for each feature. Package-by-feature is where your top-level directories are e.g. `social/`, `marketplace/` and `payments/`. You rarely turn up to work thinking "today I'll work on database code for all features", but you often turn up thinking "today I'll work on the social feature". Group your code together accordingly.

Coupling issues often manifest as O(n) changes rather than the O(1) it feels like it should be. If you've ever had a project take a long time because a large number of services needed changing, then there's a good chance you had a coupling problem.

Sometimes coupling is unavoidable. For example, your services are likely coupled with respect to the observability they emit. Likely you have a single format for metrics/logs/traces, which all services need to conform to. But this is generally an exception, and hopefully these formats are not changing often, so it's not a significant problem.

If your services are coupled with respect to core business models or logic, then you are more likely to have a problem. Your business is likely to change over time, and the more services which need changing to deliver new functionality, the slower it will be to deliver something useful.

For more:

- [Cohesion and Coupling](https://newsletter.kentbeck.com/p/coupling-and-cohesion)
