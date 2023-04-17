---
layout: post
title: "Writing better alerts"
tags: [alerting, observability, reliability]
---

<!-- markdownlint-disable MD033 -->

Getting alerts right can be hard. It’s not uncommon to see alerts which are too noisy, paging on-call engineers for small numbers of errors, where either the error rate was very low or the duration of the error-producing event was very short.

On the other hand, many alerts are not sensitive enough. Errors can occur at high rates without detection, either because the overall error rate is below the alert threshold, or because they occur in spikes much shorter than the alert window.

In this post I’ll talk through how I think about writing alerts which find a better balance. A lot of this material you can find in the alerting chapter of the [Google SRE Workbook](https://sre.google/workbook/alerting-on-slos/), but I’m writing it in my own words because I didn’t find it the easiest to follow!

I’ll assume you already have a good understanding of SLOs and error budgets.

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

<!--Error threshold
: 0.2%

Alert window
: 5 minutes -->

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
detection_time = (error_threshold * alert_window) / error_rate
```

Detection time is shorter for higher error rates (which is good!) and wider alert windows take longer to detect a given error rate. A few examples for our example 0.2% error threshold:

<div class="table-wrapper" markdown="block">

| Error rate | Detection time (5m window) | Detection time (1h window) |
| :-- | :-- | :-- |
| 0.1% | Never | Never |
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

However, this reduces **precision**! Longer alert windows improve precision, so let's try increasing it to 1 hour. We can look at how high an error spike would need to be to trigger an alert:

| Spike duration | Error rate to trigger alert |
| :-- | :-- |
| 1m | > 6% |
| 5m | > 1.2% |
| 1h | > 0.1% |

<!-- Is that OK? At this stage, it's difficult to know.

The other question is: is our detection time acceptable? Again difficult to tell. -->

So we now have this alerting rule:

<!-- - Error threshold: 0.1%
- Alert window: 1 hour -->

- **Error threshold:** 0.1%<br>
- **Alert window:** 1 hour

This is arguably better: it has improved sensitivity and precision, with a slightly longer detection time.

At this point we might ask ourselves:

1. Is this precise enough? Can we do better?
2. Is our detection time short enough? Or is it overly cautious?
3. Is it really worth waking someone up after an hour of a 0.1% error rate?

To answer these questions, let's look at burn rates.

<!-- TODO: why not just increase the alert window? It would be more precise, and detection time would still be good. Reset time would be poor though!

Steel man: error threshold = 0.1%, alert window = 1 hour.

- Precision: Good (TODO: example of non-significant event)
- Sensitivity: 100%
- Detection times
  - 0.1%: 1 hour
  - 1%: 6 minutes
  - 100%: 3.6 seconds
- Reset time: 1 hour

This might be good enough!

Things we might still want:

1. Better precision.
2. Better reset time.
3. To differentiate between "wake someone up" and "take a look at this soon". -->

<!-- We'll discuss reset time in more depth later. -->

<!-- The rest of this post will look at how we can build something even better: more precise, more sensitive, and with appropriate detection and reset times. Let’s start by looking at burn rates. -->

<!-- TODO: What detection time do we need? How do we know? -->

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

For example:

```python
# E.g. 99.9% SLO over 30 days, 0.2% error rate
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

<!-- Let's try thinking in terms of burn rates instead of error rates.

1. We want to know when we've used too much of our error budget.
2. We don't care about burn rates < 1, but anything > 1 we want to alert on.

<!-- We'll want to alert before our error budget gets exhausted, and give enough time for the responder to take appropriate action. That is, our **detection time** (and hence alert window) should be shorter for higher burn rates. We can wait longer for lower burn rates. This happens naturally, but it's maybe not enough.

Let's start by considering sensitivity. We want to catch all significant events and protect our SLO, so we'll need to alert on a burn rate of 1. -->

Let's say we want to know when we've used up 10% of our budget. It takes 30 days for this burn rate to exhaust the budget so our alert window should be 3 days. What happens to detection time for different error rates here?

<!-- As a reminder: `detection_time = (error_threshold * alert_window) / error_rate`. -->

<div class="table-wrapper" markdown="block">

| Error rate | Burn rate | Detection time | Time left to exhaustion |
| :-- | :-- | :-- | :-- |
| 0.1% | 1 | 3 days | 27 days |
| 0.6% | 6 | 12 hours | 4.5 days |
| 1.44% | 14.4 | 5 hours | ~2.75 days |
| 100% | 1000 | ~4 minutes | <40 minutes |

</div>

So our detection time doesn't need to be so short at all. Maybe a *much* longer window is actually OK, something like this:

- **Error threshold:** 0.1%<br>
- **Alert window:** 3 days

TODO: If the time to exhaustion is really long then do we really need to send an alert and potentially wake someone up? Can't we just send a notification for someone to investigate during working hours? If the problem starts on a Friday night, we need to make sure we enough time to respond on Monday morning, so let's try taking 5 days as our dividing line between *alert* and *notify*.

Perhaps we want **multiple alerting rules**. A short window for high burn rates and a long window for low burn rates. For the low burn rates, we might not need to page someone urgently, but instead send a notification to investigate later.

If we want to catch all significant events and protect our SLO, we'll need to alert on a burn rate of 1. If it takes 30 days for this burn rate to exhaust the budget, maybe let's alert after 3 days. 6 days for a burn rate of 5? Let's alert in 6 hours. 50 hours for 14.4? An hour.

<div class="table-wrapper" markdown="block">

| Alert window | Burn rate | Urgency |
| :-- | :-- | :-- |
| 1 hour | 14.4 | Page |
| 6 hours | 6 | Page |
| 3 days | 1 | Notification |

</div>

TODO: detection time for 100% error rate

### Error budget consumption

We'll look at how to convert these into alerts in a moment, but first a quick detour to think about error budget consumption.

One way to think about detection time is in terms of how much error budget gets used up before an alert fires. We can calculate this using the burn rate:

```python
error_budget_consumed = (burn_rate * alert_window) / slo_window
```

The higher the burn rate and the higher the alert window, the more error budget consumed before the alert fires.

We can look at our example alert from earlier, which had a 0.2% error rate threshold. It would fire when only 0.023% of the error budget was consumed.

```python
alert_window = 5 minutes
slo_window = 30 days = 720 hours = 720 * 60 minutes

burn_rate = 2

error_budget_consumed = (2 * 5) / (720 * 60) = 0.023% # Very sensitive!
```

Looking at the alert windows and burn rates defined above, we can calculate how much error budget gets used up before they fire. Notice that we're allowing more budget consumption for lower burn rates.

<div class="table-wrapper" markdown="block">

| Alert window | Burn rate | Error budget consumed |
| :-- | :-- | :-- |
| 1 hour | 14.4 | 2% |
| 6 hours | 6 | 5% |
| 3 days | 1 | 10% |

</div>

I like to think of this *error budget consumed* number as the area of the boxes in the diagram below. The 14.4 burn rate alert has the smallest area, it fires after only 2% of the error budget is consumed. The 1 burn rate has the largest area, requiring 10% of the error budget be consumed.

{% include figure.html
  img_src="/public/assets/alerting/multi-alert.png"
  caption="Multiple alert detection zones (not to scale)"
  size="small"
%}

## Alerting on burn rates

TODO: write some alerting rules!

### Precision, sensitivity and detection time

TODO: how do these compare to the original alert?

## Improving reset time

TODO: I haven't talked much about reset time yet. Time for multi-window alerts.

## Caveats

TODO:

- Low traffic services
- The effect of high and low SLOs (90% and 99.999%)
  - And the effect of short windows? E.g. daily? Or 15 minutes?
- Not all requests are equal - can classify requests and have different SLOs for different classes

## Conclusion

- TODO:
  - `for: <duration>` considered harmful
  - Long windows are Good, actually
    - As long as you're calculating them efficiently...

- TODO: Building something *really good* often means striving for better than something like an SLO. You might not be happy with the bare minimum of e.g. 99.9% availability. Your customers might not be either. It can be worth considering making your alerts stricter than necessary to encourage you to keep improving reliability or performance. Be careful with page-level alerts though, this is not worth waking people up for, instead it's a job for notification-level alerts. NOTE: Do not impose this on other people/teams!

## Further reading

- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Prometheus - Querying basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Precision and sensitivity](https://en.wikipedia.org/wiki/Precision_and_recall)
