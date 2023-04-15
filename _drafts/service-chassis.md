---
layout: post
title: Service chassis
---

A [microservice chassis](https://microservices.io/patterns/microservice-chassis.html)

A rule of thumb:

- include parts of the system where consistency across services is important, e.g. communication protocols, observability
- exclude features which can vary across services with little impact, e.g. database integration, testing



---

- HTTP (server and client)
- Pub/Sub
- Kubernetes compatible health check endpoints
- [distributed tracing](https://opentracing.io/)
- structured, [correlated](https://microsoft.github.io/code-with-engineering-playbook/observability/correlation-id/) logging
- metrics
- dependency injection (DI)
- type-safety
    - DI dependencies
    - incoming messages (HTTP requests and Pub/Sub messages)
- [graceful shutdown](https://learnk8s.io/graceful-shutdown)

Some common aspects of our services still live outside of the shell, including:

- configuration
- database integration
