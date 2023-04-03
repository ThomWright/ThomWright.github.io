---
layout: post
title: "Auto-scaling: positive feedback loops"
tags: [microservices, reliability, queues]
---

<!-- markdownlint-disable MD033 -->

[No chairs this time](/2022/05/05/auto-scaling/).

Consider a scenario where we have two services, A and B. A is consuming messages from a queue and sending requests to B. The message queue is backing up. There is a growing number of pending messages which Service A hasn’t received yet.

{% include figure.html
  img_src="/public/assets/auto-scale-services.png"
  caption="A queue backing up"
  alt="Service diagram of a queue backing up"
%}

This is a sign that the consuming service can’t keep up with the rate of messages arriving through the queue. One might be tempted to scale up Service A by adding more replicas. Perhaps even doing this automatically. After all, it isn’t keeping up, surely if there are more replicas then it will do a better job at handling more messages?

Let’s consider what might happen if we do that. There are two distinct cases to consider, with drastically different consequences. The key question we should be asking here is “why?”. And perhaps a [few more times](https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.concept.fivewhys.en.html) until the root cause(s) have been identified. So we look at some metrics to start understanding why this service is struggling.

**Case 1:** We see that the Service A is taking longer to process messages than usual. This helps explain why the messages are backing up. As an example, if we can process 100 messages concurrently at 10ms per message, we can process 10k messages per second. If it starts taking 50ms per message, we can only process 2k per second. Throughput goes down as latency increases. We can’t handle as many messages as we normally can.

Again, we ask why. Why is it taking longer to process messages? We find that the service is using 90% CPU. This explains the increased latency. Whenever anything (e.g. a message handler) wants to run on the CPU, there’s a 90% chance the CPU is busy and it will have to wait. The higher the CPU utilisation, the longer it is likely to have to wait.

It might also be worth asking “why is this using so much CPU?”, but for now let’s say this is a reasonable amount of CPU to use for this throughput. We consider this increased CPU utilisation to be the root cause.

In this case, a sensible course of action is to provision more CPU resources, either horizontally (more replicas) or vertically (bigger machines, higher CPU allocation). Auto-scaling will help here.

But this isn’t the only possible root cause.

**Case 2:** Again, we look at the metrics and see increased latency for Service A. But we don’t see any increased CPU use. Instead we look at some traces and see some requests to Service B which are taking a long time. Looks like Service A is slow because Service B is slow. Why is service B slow?

Again, increased CPU usage. So Service B can’t handle the load, every request is contending for CPU, requests slow down, which slows down Service A, which results in increasing numbers of pending messages on the queue.

What will auto-scaling Service A do in this case? It will mean more messages per second will get taken off the queue by Service A. This will in turn send more messages to Service B. Service B will get even more overloaded, so it will get slower. Service A still can’t keep up with messages from the queue, so it scales even more. Sends more messages to B. B gets so clogged up its throughput becomes basically zero. Bang. System down.

Whoops.

So our two cases are:

1. The consuming service is resource starved
2. A dependency is resource starved

In the first case, auto-scaling will help. In the second, it is likely to make the problem worse.

Auto-scaling is supposed to reduce the risk of catastrophe when experiencing increased load, but here we have produced a risk *magnifier*. As soon as we get more traffic than a dependency somewhere can handle, instead of backing off we throw more load at it.

**Let queues handle temporary overload.** A queue temporarily backing up is better than overloading a service or database to the point of failure. Let the queue handle the [backpressure](https://www.tedinski.com/2019/03/05/backpressure.html). This is one of the reasons to choose a queue in the first place. If this state continues, send an alert so someone can manually investigate. If you aren't using a queue like in this example, consider using a [circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html).

**Scale based on resource utilisation and saturation**. Increasing the replica count will only get you out of trouble if it increases a scarce resource. If your service is running out of CPU, memory, or perhaps database connections, scaling up might help. But make sure you have enough of these resources available to successfully run these extra replicas. If you have a fixed number of machines or database connections, you don’t want to scale to the point that you run out of them. This turns a local problem (one service) into a global problem (all services running on the same machines or connecting to the same database).

**Test what happens when scaling up to your maximum replica count.** If auto-scaling based on some metric, test what happens when that metric goes high enough to auto-scale to the max. If you can’t trigger that condition, reduce your auto-scaling settings to something you can trigger. You want to know what will happen in these cases.
