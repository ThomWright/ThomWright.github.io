---
layout: post
title: "Writing better alerts"
tags: [alerting, observability, reliability]
---

<!-- markdownlint-disable MD033 -->

Getting alerts right can be hard. It’s not uncommon to see alerts which are too noisy, paging on-call engineers for small numbers of errors, where either the error rate was very low or the duration of the error-producing event was very short. On the other hand, many alerts are not sensitive enough and errors can occur at high rates without detection.

In this post I’ll talk through how I approach writing alerts which find a better balance.

I'll start with a [simple example](#simple-example) and consider how to [measure success](#measuring-success). We'll improve the [sensitivity and precision](#improving-sensitivity-and-precision) and look at how to use [burn rates](#improving-detection-time-using-burn-rates) to inform detection time. I'll use the idea of [error budget consumption](#error-budget-consumption) to design a [new set of alerts](#alerting-on-budget-consumption), and finally I'll go through actually [writing the new alerting rules](#writing-the-alerting-rules) and [improving reset time](#improving-reset-time).

This is a long post, so if you like you can jump straight to the [conclusions](#conclusions).

## Definitions

Let’s start off with some definitions. First, the basics about alerts and SLOs:

Alert

: A notification of a significant event. Probably results in an on-call engineer being paged. Alerts are configured by **alerting rules**.

Event

: Something which is causing increased error rates. An event might trigger an alert. A **significant event** is one we want to alert on. Not all events are significant.

SLO

: Service Level Objective, e.g. 99.9% successful requests over 30 days. The **SLO rate** is the percentage of successful requests (99.9%), and the **SLO window** is the duration (30 days). Atlassian have a good overview of [SLIs vs SLOs vs SLAs](https://www.atlassian.com/incident-management/kpis/sla-vs-slo-vs-sli).

Error budget

: The inverse of the SLO, i.e. 0.1% over 30 days in this case. A measure of how many errors we can have while still meeting our SLO.

Burn rate

: How quickly the error budget is getting used up. A constant 1% error rate would take 3 days to use up an entire 30 day error budget.

## Simple example

Let's assume we have an SLO of 99.9% availability (successful requests) over 30 days.

{% include callout.html
  type="aside"
  content="I'll be using this example SLO for the rest of this post."
%}

One of the simplest alerts we could write is something like this in [PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/):

```text
((
  sum(rate(requests_errors_total[5m]))
  /
  sum(rate(requests_total[5m]))
) * 100
) < 99.8
```

This alerts if we have an error rate higher than 0.2%, averaged over the last 5 minutes.

We could write this as:

- **Error threshold:** 0.2%<br>
- **Alert window:** 5 minutes

There are several ways this could miss significant events, as illustrated below. The blue dashed line is our SLO error threshold, the yellow box represents the alert detection threshold, and the red boxes show errors. If the area of the red box is large than the yellow box then the alert will fire.

<div class="multi-figure">
{% include figure.html
  img_src="/public/assets/alerting/simple-spikes.png"
  caption="False negative: 30-second 0.3% error spikes"
  size="small"
%}

{% include figure.html
  img_src="/public/assets/alerting/simple-steady.png"
  caption="False negative: steady 0.15% error rate"
  size="small"
%}
</div>

First, we see an error spikes of 0.3%, lasting 30 seconds each, an average of 0.15% over 5 minutes. This is less than 0.2% so won’t be detected, but if this happened too frequently then it could blow the error budget. Second, the error rate is 0.15% for the full 5 minutes. This could continue undetected indefinitely, and would eventually blow the error budget.

{% include figure.html
  img_src="/public/assets/alerting/fp-spike.png"
  caption="False positive: 1% spike for 1 minute"
  size="small"
%}

There's another problem too. A one-off error spike of > 1% for 1 minute (> 0.2% average over 5 minutes) *would* trigger the alert. The issue would have resolved itself before an engineer was able to respond. This is *not a significant event*, and while it might be worth investigating, it's probably not worth waking anyone up for.

## Measuring success

So this alerting rule has some problems. It's worth defining what these are so we know how to improve. We'll be using the following measures of success:

Precision

: What proportion of detected events were significant? Higher is better.

  Low precision means we alert too much on non-significant events.

Sensitivity

: What proportion of significant events were detected? Higher is better.

  Low sensitivity means the significant events are not alerted on.

Detection time

: How long after a significant event starts does the alert fire? Shorter is better.

Reset time

: How long after the significant event ends does the alert continue firing? Shorter is better.

Considering the alerting rule above, we can say that it is **not sensitive** enough because it doesn't alert on all significant events. We can also say it's **not precise** enough because it alerts on non-significant events.

Reducing the error threshold to 0.1% would make the alert more sensitive, but less precise, and vice versa for increasing the error threshold.

```python
detection_time = error_threshold * alert_window / error_rate
```

Detection time is shorter for higher error rates (which is good!) and wider alert windows take longer to detect a given error rate. A few examples for our example 0.2% error threshold:

<div class="table-wrapper" markdown="block">

| Error rate | Detection time (5m window) | Detection time (1h window) |
| :-- | :-- | :-- |
| 0.1% | ∞ | ∞ |
| 0.2% | 5m | 1h |
| 1% | 1m | 12m |
| 10% | 6s | 1.2m |
| 100% | 0.6s | 7.2s |

</div>

{% include callout.html
  type="info"
  content="In practice, alerting rules will likely be run at regular intervals, e.g. 10 seconds. In which case it could take up to 10 seconds to detect a 100% error rate."
%}

A shorter alert window also reduces precision. Imagine using a 1 minute window - a single 1 minute period of 0.2% error rate could trigger the alert despite not being significant. This would not trigger when using the 5 minute window.

TODO: reset time

## Improving sensitivity and precision

Let's start by looking at **sensitivity**. Our SLO requires 99.9% successful requests, but we're only alerting on a 0.2% error rate. This is trivially fixed by changing our error threshold to 0.1%. This gives us 100% sensitivity: every significant event will now trigger an alert.

However, this reduces **precision**! Alerts will now fire for shorter and lower error spikes which are not significant. Wider alert windows improve precision, so let's try increasing this to 1 hour. We can look at how high an error spike would need to be to trigger an alert:

| Spike duration | Error rate to trigger alert |
| :-- | :-- |
| 1m | > 6% |
| 5m | > 1.2% |
| 1h | > 0.1% |

So we now have this alerting rule:

- **Error threshold:** 0.1%
- **Alert window:** 1 hour

This is arguably better: it has improved both sensitivity and precision, with a slightly longer detection time.

At this point we might ask ourselves:

1. Is this precise enough? Can we do even better?
2. Is our detection time too long? Or perhaps too short?
3. Is it really worth waking someone up after an hour of a 0.1% error rate?

To answer these questions, let's look at burn rates.

## Improving detection time using burn rates

As stated above, a burn rate is how fast we’re using up our error budget. Burn rates are really useful because they give us a good idea of how quickly we need to respond to a given event before our SLO is impacted. That is, it tells us what our detection time should be!

A burn rate of 1 will use up the exact error budget in the SLO window. For our example SLO it will take 30 days to use up the entire budget. A burn rate > 1 will use up the error budget in less time.

{% include callout.html
  type="aside"
  content="For simplicity I'll assume near-constant request and error rates."
%}

{% include figure.html
  img_src="/public/assets/alerting/remaining-budget.png"
  caption="Burn rates using up an error budget"
  size="small"
%}

Given an SLO and an error rate we can work out a burn rate, and how long it will take to exhaust the error budget:

```python
burn_rate = error_rate / (1 - slo_rate)
time_to_exhaustion = slo_window / burn_rate
```

For our example SLO with a 0.2% error rate:

```python
burn_rate = 0.002 / (1 - 0.999) = 2
time_to_exhaustion = 30 / 2 = 15 # days
```

Here’s a handy table with some examples:

<div class="table-wrapper" markdown="block">

| Error rate | Burn rate (99.9% SLO) | Time to exhaustion (30 day SLO) |
| :-- | :-- | :-- |
| 0.1% | 1 | 30 days |
| 0.2% | 2 | 15 days |
| 0.5% | 5 | 6 days |
| 0.6% | 6 | 5 days |
| 1% | 10 | 3 days |
| 1.44% | 14.4 | 50 hours |
| 3.6% | 36 | 20 hours |
| 100% | 1,000 | 43 minutes |

</div>

## Error budget consumption

Before writing any alerts, let's think about error budget consumption.

One way to think about detection time is in terms of how much error budget gets used up before an alert fires. We can calculate this using the burn rate:

```python
error_budget_consumed = burn_rate * alert_window / slo_window
```

The higher the burn rate and the wider the alert window, the more error budget consumed before the alert fires.

Consider our example alert from earlier, which had a 0.2% error rate threshold. It would fire when only 0.023% of the error budget was consumed.

```python
alert_window = 5 minutes
slo_window = 30 days = 720 hours = 720 * 60 minutes

burn_rate = 2

error_budget_consumed = (2 * 5) / (720 * 60) = 0.023% # Very sensitive!
```

I like to think of this *error budget consumed* number as the area of the boxes in the diagram below.

<!-- {% include figure.html
  img_src="/public/assets/alerting/multi-alert.png"
  caption="Multiple alert detection zones (not to scale)"
  size="small"
%} -->

{% include figure.html
  img_src="/public/assets/alerting/10-pc-budget.png"
  caption="Detection thresholds for three alerts with 10% error budget consumption"
  size="small"
%}

## Alerting on budget consumption

Let's say we want to know when we've used up 10% of our budget. It takes 30 days for this burn rate to exhaust the budget so our alert window should be 3 days. What happens to detection time for different error rates here?

<div class="table-wrapper" markdown="block">

| Error rate | Burn rate | Detection time | Time left to exhaustion |
| :-- | :-- | :-- | :-- |
| 0.1% | 1 | 3 days | 27 days |
| 0.6% | 6 | 12 hours | 4.5 days |
| 1.44% | 14.4 | 5 hours | ~2.75 days |
| 100% | 1000 | ~4 minutes | <40 minutes |

</div>

It seems our detection time doesn't need to be so short at all. Maybe a *much* longer window is actually OK, something like this:

- **Error threshold:** 0.1%<br>
- **Alert window:** 3 days

If it takes a really long time to exhaust the error budget, do we even need to send an alert and potentially wake someone up? Maybe w can just send a notification for someone to investigate during working hours.

To do this, we can create **multiple alerting rules**. A short window for high burn rates and a long window for low burn rates. For the low burn rates, we might not need to page someone urgently, but instead send a notification to investigate later.

If the problem starts on a Friday night, we need to make sure we enough time to respond on Monday morning. So let's try taking 5 days as our dividing line, which is a burn rate of 6. If time to exhaustion is less than five days, we can treat this more urgently.

We might want to be more conservative with our error budget at high burn rates. To work out what alert windows to configure, we can rearrange the equation above into this:

```python
alert_window = error_budget_consumed * slo_window / burn_rate

# E.g. burn rate = 6, budget consumption = 5%
alert_window = 0.05 * 30 / 6 = 0.25 # days
```

To catch all significant events and protect our SLO, we'll need to keep our alerting rule for a burn rate of 1. Our alerting rule for a burn rate of 6 will be more urgent, and we'll configure it to consume less error budget. Detection time for a complete outage is more than, which we could reduce to under a minute by using another alerting rule with an even shorter window for a higher burn rate.

What we end up with is something like this.

<div class="table-wrapper" markdown="block">

| Burn rate | Error budget consumed | Alert window | Urgency |
| :-- | :-- | :-- | :-- |
| 14.4 | 2% | 1 hour | Page |
| 6 | 5% | 6 hours | Page |
| 1 | 10% | 3 days | Notification |

</div>

Now we know what we're aiming for, we can take a look at writing the alerting rules.

## Writing the alerting rules

TODO: write some alerting rules! How are these calculated? Do we need recording rules?

## Improving reset time

TODO: I haven't talked much about reset time yet. Time for multi-window alerts.

## Caveats

TODO:

- Low traffic services
- The effect of high and low SLOs (90% and 99.999%)
  - And the effect of short windows? E.g. daily? Or 15 minutes?
- Not all requests are equal - can classify requests and have different SLOs for different classes
- If you have already used up much of your budget for the current SLO period, your alerts might not be sensitive enough.

## Conclusions

1. To improve **precision** (make alerts less noisy), we can widen the *alert window* or increase the *error threshold*.
2. To improve **sensitivity** (make sure we catch all significant errors), we can reduce our *error threshold*. Setting it to match our SLO rate gives us 100% sensitivity.
3. To choose acceptable **detection times** we can look at *burn rates* and *error budgets*. By considering how long it takes to exhaust our error budget, and how much budget we're willing to use, we can choose an acceptable *alert window*.
4. We can make use of *multiple alerting rules* for different severities. For non-urgent events, we can notify instead of paging. This can help make life less stressful for on-call engineers.
    - For low urgency:
      - Precision: lower
      - Sensitivity: higher
      - Detection time: longer
      - Action: notify
    - For high urgency:
      - Precision: higher
      - Sensitivity: lower
      - Detection time: shorter
      - Action: page

- TODO:
  - `for: <duration>` considered harmful
  - Long windows are Good, actually
    - As long as you're calculating them efficiently...

- TODO: Building something *really good* often means striving for better than something like an SLO. You might not be happy with the bare minimum of e.g. 99.9% availability. Your customers might not be either. It can be worth considering making your alerts stricter than necessary to encourage you to keep improving reliability or performance. Be careful with page-level alerts though, this is not worth waking people up for, instead it's a job for notification-level alerts. NOTE: Do not impose this on other people/teams!

## Further reading

- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Prometheus - Querying basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Precision and sensitivity](https://en.wikipedia.org/wiki/Precision_and_recall)
