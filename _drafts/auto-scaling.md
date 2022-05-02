---
layout: post
title: How many chairs do I need?
---

<!-- markdownlint-disable MD036 -->

Let’s imagine a scenario where I’m trying to decide how many chairs I need for my new flat. In this imaginary scenario I live with a partner, and I have two types of chair to choose from:

- A normal chair. This takes up some space in the flat.
- A magic fold-up chair. This takes up space when unfolded, but zero space when folded.

How many chairs do I need?

Well, I live with my partner so clearly I need two, at least. That’s the minimum number of chairs I need. We’ll be using them a lot, so we’ll just go with the normal chairs.

**Min. chairs required: 2**

We might invite friends or family over for dinner occasionally, so we decide to also get 15 magic chairs. That’s a total of of 17 chairs. More is better, right?

One day we think: “let’s put out all the chairs, just to see what it looks like”. While putting out the chairs, we realise we can’t actually fit them all in. We can only fit 12 unfolded chars in the flat. Whoops.

**Max. chairs the flat can support: 12**

What did we do wrong here?

- We didn’t consider how many chairs we actually need, based on expected number of visitors. We just chose an arbitrary number.
- We didn’t test how many chairs we can actually fit.

What should we do instead?

First, think about how many people we expect to host in total. This is what should inform how many chairs we need.

Second, once we’ve worked out how many chairs we need in total, think about how often we’ll be using these chairs. If some chairs will be rarely used, we can use magic chairs so they only take up space when they’re needed.

Let’s work through an example.

We have two people in the flat full time. The busiest time of year is expected to be Christmas, when four parents will be visiting for dinner. Turns out we don’t have many friends.

**Max. expected chairs in use: 6**

It’s possible, but unlikely, that one day we’ll host a small party, or have someone else over for Christmas. We don’t want to get caught out, so we’d like another couple of chairs, just in case.

**Buffer: 2**

**Chair capacity required: 8**

Now we know how many chairs we need. Nice.

Since we rarely have visitors, we know we only need to keep two chairs around most of the time. So six of those chairs can be magic chairs, to save space most of the year.

Much better.

Now, let’s imagine another example where we already have lots of chairs in the flat:

- 4 dining chairs
- 2 desk chairs
- 2 camping chairs
- a 3 seat sofa

For a total of 11 seats. Based on expected use we worked out we only need 8 chairs to handle all of our expected visitors, including a reasonable buffer for unexpected visitors.

Do we need any magic folding chairs? No. In this case we already have enough to need our needs. In fact, in we do get an extra, unnecessary, magic chair, we face the risk that we won’t be able to fit it in. Which doesn’t sound so bad, so instead imagine if these chairs were *really heavy*, and when we got it out to use it the floor collapsed. The point is, if we don’t test it then it’s a risk.

Alright, the analogy is breaking down a bit by now. In case you hadn’t guessed, I’m not really talking about chairs here. I’m talking about auto-scaling. Specifically, [horizontal pod auto-scaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) in Kubernetes.

I think many people think about auto-scaling as in the original example, but there are several problems with this:

1. Pods aren’t free. They use resources including CPU, memory, file descriptors, maybe database connections. We need to make sure we have enough of these resources to support the number of pods we want to scale up to. Importantly, we need to test these cases. There are often unknown limits in our infrastructure. We want to find these in a controlled way, not hit them in an uncontrolled way while under peak levels of traffic.
2. It’s not based on the reality of expected load. The numbers were arbitrary. We should really be thinking in terms of how many resources we need to handle our expected traffic. We should also be prepared for a reasonable amount of unexpected traffic. How much buffer you need will be context-dependent.
3. Simply saying “more is better” is an infinite argument that never ends. One can say: “we have 3 pods, let’s have 2 more on standby just in case”. However the obvious next step is: “we have a 5 pod maximum, let’s add another 2 on standby just in case”. Ad infinitum. Again, it is not possible to decide on a sensible maximum without considering the reality of expected load.

In my opinion we shouldn’t be saying: “we have X pods provisioned, let’s add auto-scaling to *scale up*, just in case”. We should instead be saying: “based on expected load we need X pods maximum, can we *scale down* sometimes to save costs?”. I think this mindset shift is important, and approaching the problem from this perspective encourages us to build more appropriate systems for the context we're working in.
