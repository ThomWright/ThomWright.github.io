---
layout: post
title: "Alerting: SLOs, error budgets and burn rates"
tags: [alerting, observability, reliability]
---

<!-- markdownlint-disable MD033 -->

Getting alerts right can be hard. It’s not uncommon to see alerts which are too sensitive, paging on-call engineers for small numbers of errors, where either the error rate was very low or the duration of the error-producing event was very short.

On the other hand, many alerts are not sensitive enough. Errors can occur at high rates without detection, either because the overall error rate is below the alert threshold, or because they occur in spikes much shorter than the alert window.

In this post I’ll talk through how I think about writing alerts which find a better balance. A lot of this material you can find in the alerting chapter of the [Google SRE Workbook](https://sre.google/workbook/alerting-on-slos/), but I’m writing it in my own words because I didn’t find it the easiest to follow!

I’ll assume you already have a good understanding of SLOs and error budgets.

## Definitions

Let’s start off with some definitions. First, the basics:

- **SLO**&nbsp;– Service Level Objective, e.g. 99.9% successful requests over 30 days.
- **SLO rate**&nbsp;– The required percentage of successful requests, 99.9% in this case.
- **SLO window**&nbsp;– The duration the SLO considers, 30 days in this case.
- **Error budget**&nbsp;– The inverse of the SLO, i.e. 0.1% over 30 days in this case. A measure of how many errors we can have while still meeting our SLO.
- **Burn rate**&nbsp;– How quickly the error budget is getting used up. A constant 1% error rate would take 3 days to use up an entire 30 day error budget.

When I talk about alerts, I mean:

- **Event**&nbsp;– Something which is causing increased error rates. Might trigger an alert.
- **Significant event**&nbsp;– An event which is using too much of the error budget. We want to alert on these.
- **Alert**&nbsp;– A notification of a significant event. Probably results in an on-call engineer being paged.
- **Alerting rule**&nbsp;– The configuration for when an alert fires.
- **Alert rate**&nbsp;– The error rate threshold considered by an alerting rule.
- **Alert window**&nbsp;– The duration considered by an alerting rule.

And this is how we’ll measure how good an alerting system is:

- **Precision**&nbsp;– What proportion of detected events were significant? Low precision means we alert too much on non-significant events.
- **Sensitivity**&nbsp;– What proportion of significant events were detected? Low sensitivity means the significant events are not alerted on.
- **Detection time**&nbsp;– How long after a significant event starts does the alert fire?
- **Reset time**&nbsp;– How long after the significant event ends does the alert continue firing?

## Simple example

Let's assume we have an SLO of 99.9% availability (successful requests) over 30 days.

{% include callout.html
  type="aside"
  content="I'll be using this example SLO for the entirety of this post."
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

- Error threshold: 0.2%
- Alert window: 5 minutes

There are several ways this could miss significant events, as illustrated below. The blue dashed line is our SLO threshold, the yellow box represents the alert detection threshold, and the red boxes show errors. If the area of the red box is large than the yellow box then the alert will fire.

<div class="multi-figure">
{% include figure.html
  img_src="/public/assets/alerting/simple-spikes.png"
  caption="30-second 0.3% error spikes"
  size="small"
%}

{% include figure.html
  img_src="/public/assets/alerting/simple-steady.png"
  caption="Steady 0.15% error rate"
  size="small"
%}
</div>

First, we see an error spikes of 0.3%, lasting 30 seconds each, an average of 0.15% over 5 minutes. This is less than 0.2% so won’t be detected, but if this happened too frequently then it could blow the error budget. Second, the error rate is 0.15% for the full 5 minutes. This could continue undetected indefinitely, and would eventually blow the error budget. We can say that the alerting rule is **not sensitive** enough.

We can also say this alerting rule is **not precise** enough. A one-off error spike of 2% for 1 minute (0.4% average over 5 minutes) would trigger the alert. The issue would have resolved itself before an engineer was able to respond. This is not a significant event, and while it might be worth investigating, it's probably not worth waking anyone up for.

```python
detection_time = (alert_error_rate * alert_window) / error_rate

# 0.2% error rate
detection_time = (0.002 * 5) / 0.002 = 5 # minutes

# 100% error rate
detection_time = (0.002 * 5) / 1 = 0.01 # minutes
```

At this point, it’s worth noting the effect the alert window has on detection time. A wider alert window takes longer to detect a given error rate. For example, this 5 minute window takes 5 minutes to detect a 0.2% error rate, 1 minute to detect a 1% error rate and 0.6 seconds to detect a 100% error rate. A 1 hour window would take 1 hour for 0.2% and 12 minutes for 1%.

{% include callout.html
  type="info"
  content="In practice, alerting rules will be run at regular intervals, e.g. 10 seconds. In which case it could take up to 10 seconds to detect a 100% error rate."
%}

Decreasing the alert rate or window will decrease the detection time, but at the cost of making the alerting rule less precise.

The rest of this post will look at how we can build something better: more precise, more sensitive, with acceptable detection time. Let’s start by looking at burn rates.

## Burn rates

As stated above, a burn rate is how fast we’re using up our error budget. A burn rate of 1 will use up the exact error budget in the SLO window. For our example SLO it will take 30 days to use up the entire budget. A burn rate >1 will use up the error budget in less time. This gives us a good idea of how quickly we need to alert to a given event, and how soon we need to respond before our SLO is impacted.

{% include callout.html
  type="aside"
  content="For simplicity I'll assume a near-constant request rate."
%}

{% include figure.html
  img_src="/public/assets/alerting/remaining-budget.png"
  caption="Burn rates using up an error budget"
  size="small"
%}

Given an SLO and an error rate we can work out a burn rates, and how long it will take to exhaust the error budget:

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

Here’s a handy chart with some examples, which we’ll be referring to as we go.

<div class="table-wrapper" markdown="block">

| Error rate | Burn rate (99.9% SLO) | Time to exhaustion (30 day SLO)  |
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

Let's try thinking in terms of burn rates instead of error rates.

We'll want to alert before our error budget gets exhausted, and give enough time for the responder to take appropriate action. That is, our **detection time** (and hence alert window) should be shorter for higher burn rates. We can wait longer for lower burn rates.

Perhaps we want **multiple alerting rules**. A short window for high burn rates, a medium window for medium burn rates, and a long window for low burn rates. For the low burn rates, we might not need to page someone urgently, but instead send a notification to investigate later.

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

## Further reading

- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Prometheus - Querying basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Precision and sensitivity](https://en.wikipedia.org/wiki/Precision_and_recall)
