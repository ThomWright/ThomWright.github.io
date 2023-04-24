---
layout: post
title: "Writing better alerts"
tags: [alerting, observability, reliability]
---

<!-- markdownlint-disable MD033 -->

Getting alerts right can be hard. It’s not uncommon to see alerts which are too noisy, paging on-call engineers for small numbers of errors, where either the error rate was very low or the duration of the error-producing event was very short. This can cause alert fatigue, and result in real incidents being ignored. On the other hand, many alerts are not sensitive enough and errors can occur at high rates without detection.

In this post I’ll talk through how I approach writing alerts which find a better balance.

I'll present a [simple example](#simple-example) which has some problems, and set out to improve it. To do that, we need to know how to [measure success](#measuring-success). I'll start by considering [sensitivity and precision](#improving-sensitivity-and-precision), introduce [burn rates](#burn-rates) and [error budgets](#error-budget-consumption) to determine appropriate [detection times](#detection-time), and show how to handle different [levels of urgency](#urgency). Putting the pieces together we can [design a better set of alerts](#final-design). Finally I'll go through actually [writing the new alerting rules](#writing-the-alerting-rules).

If you like you can jump straight to the [conclusions](#conclusions).

## Definitions

Let’s begin with some definitions.

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

One of the simplest alerts we could write is something like this [Prometheus alerting rule](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) written in [PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/):

```yaml
# Simplified for clarity
- alert: HighErrorRate
  expr: >
    ((
      sum(rate(requests_errors_total[5m]))
      /
      sum(rate(requests_total[5m]))
    ) * 100
    ) > 0.2
```

This alerts if we have an error rate higher than 0.2%, averaged over the last 5 minutes.

We could write this as:

- **Error threshold:** 0.2%<br>
- **Alert window:** 5 minutes

{% include callout.html
  type="warning"
  content="This alerting rule is deliberately not using the `for:` clause. The problems with this clause are well described in Google's [Site Reliability Workbook](https://sre.google/workbook/alerting-on-slos/#3-incrementing-alert-duration)."
%}

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

A shorter alert window also reduces precision. Imagine using a 1 minute window -- a single 1 minute period of 0.2% error rate could trigger the alert despite not being significant. This would not trigger when using the 5 minute window.

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

Our first step towards answering these questions is burn rates.

## Burn rates

As stated above, a burn rate is how fast we’re using up our error budget. Burn rates are really useful because they give us a good idea of how quickly we need to respond to a given event before our SLO is impacted. That is, it tells us what our **detection time** should be!

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

Consider our example alert from earlier, which had a 0.2% error rate threshold. It would fire when only 0.023% of the error budget was consumed. This is very sensitive! Arguably *too* sensitive.

```python
alert_window = 5 minutes
slo_window = 30 days = 720 hours = 720 * 60 minutes

burn_rate = 2

error_budget_consumed = (2 * 5) / (720 * 60) = 0.023%
```

I like to think of this *error budget consumption* number as the area of the boxes in the diagram below.

{% include figure.html
  img_src="/public/assets/alerting/10-pc-budget.png"
  caption="Detection thresholds for three alerts with 10% error budget consumption. Each has the same area."
  size="small"
%}

## Detection time

Alerting after using 0.023% of our error budget is going to generate too many noisy alerts for non-significant events. Instead of designing alerts based on error rates, we could start from error budget consumption, and only alert after a **significant** amount of budget has been consumed. For example, we could alert after using 10% of our budget. For a burn rate of 1, it takes 3 days to consume 10% of the budget.

What happens to **detection time** for different error rates if we use a 3 day alert window?

<div class="table-wrapper" markdown="block">

| Error rate | Burn rate | Detection time | Time left to exhaustion |
| :-- | :-- | :-- | :-- |
| 0.1% | 1 | 3 days | 27 days |
| 0.6% | 6 | 12 hours | 4.5 days |
| 1.44% | 14.4 | 5 hours | ~2.75 days |
| 100% | 1000 | ~4 minutes | <40 minutes |

</div>

By looking at how long it takes to exhaust the error budget, we see that we can justify a much longer detection time, which gives us better **precision**. So our alerting rule now becomes:

- **Burn rate:** 1<br>
- **Alert window:** 3 days

## Urgency

Now, if it takes a really long time to exhaust the error budget, do we even need to send page someone and potentially wake them up? In this case, perhaps we could just send a notification for someone to investigate during working hours.

To do this, we can create **multiple alerting rules**. A short window for high burn rates and a long window for low burn rates. For the low burn rates, we might not need to page someone urgently, but instead send a notification to investigate later.

If the problem starts on a Friday night, we need to make sure we enough time to respond when someone checks the notifications on Monday morning. So let's try taking 5 days as our dividing line, which gives us a burn rate of 6. If time to exhaustion is less than 5 days, we can treat this more urgently.

We might want to be more conservative with our error budget at high burn rates. To work out what alert windows to configure, we can rearrange the equation above. If we want to alert after using 5% of the error budget, our alert window would need to be 6 hours (0.25 days).

```python
alert_window = error_budget_consumed * slo_window / burn_rate

# E.g. burn rate = 6, budget consumption = 5%
alert_window = 0.05 * 30 / 6 = 0.25 # days
```

Remember, shrinking the alert window reduces precision. But, increasing the error rate (or burn rate in this case) *increases* precision, so these somewhat balance out.

Optionally, we can add another alert for even more urgent events.

## Final design

Now we have all we need to design our new alerting rules! What we end up with is something like this:

<div class="table-wrapper" markdown="block">

| Burn rate | Error budget consumed | Alert window | Action |
| :-- | :-- | :-- | :-- |
| 14.4 | 2% | 1 hour | Page |
| 6 | 5% | 6 hours | Page |
| 1 | 10% | 3 days | Notification |

</div>

{% include figure.html
  img_src="/public/assets/alerting/multi-alert.png"
  caption="Multiple alert detection zones (not to scale)"
  size="small"
%}

The advantages of this system:

1. Any event which could result in failing the SLO will be alerted on.
2. Events need to be quite significant to generate an alert. We need to use at least 2% of the error budget for any alert to fire. Low error rates need to consume at least 10% of the error budget.
3. Only urgent alerts will result in an on-call engineer being paged.

Now we know what we're aiming for, we can take a look at writing the alerting rules.

## Writing the alerting rules

TODO: write some alerting rules! How are these calculated? How efficiently? Do we need recording rules?

Let's start with our `burn rate = 1` alert.

- **Burn rate:** 1
- **Alert window:** 3 days

```yaml
expr: >
  ((
    sum(rate(requests_errors_total[3d]))
    /
    sum(rate(requests_total[3d]))
  ) * 100
  ) > 0.1
```

This is gonna be slow. Looking back over 3 days can be a lot of data.

You might think: "rate just does `(last_sample - first_sample) / time_range`, what's the problem?". Conceptually, yes, but it needs to look back over the entire time period to adjust for counter resets in (e.g. when your service restarts). This turns the calculation from constant to linear. Not good!

TODO: Can we get prometheus to calculate this efficiently? I can't find a way. Recording rules don't seem to help much. Every rule evaluation will do the entire rate calculation again. It can't incrementally build upon the previous result.

<!-- ```yaml
expr: (
        job:slo_errors_per_request:ratio_rate1h{job="myjob"} > (14.4*0.001)
      or
        job:slo_errors_per_request:ratio_rate6h{job="myjob"} > (6*0.001)
      )
severity: page

expr: job:slo_errors_per_request:ratio_rate3d{job="myjob"} > 0.001
severity: ticket
```

```yaml
record: job:slo_errors_per_request:ratio_rate10m
expr: >
  sum(rate(slo_errors[10m])) by (job)
    /
  sum(rate(slo_requests[10m])) by (job)
``` -->

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

TODO: something about engineering trade-offs...

1. To improve **precision** (make alerts less noisy), we can widen the *alert window* or increase the *error threshold*.
2. To improve **sensitivity** (make sure we catch all significant errors), we can reduce our *error threshold*. Setting it to match our SLO rate gives us 100% sensitivity.
3. To choose acceptable **detection times** we can look at *burn rates* and *error budgets*. By considering how long it takes to exhaust our error budget, and how much budget we're willing to use, we can choose an acceptable *alert window*.
4. We can make use of *multiple alerting rules* for different levels of urgency. For non-urgent events, we can notify instead of paging. This can help make life less stressful for on-call engineers.

    | Urgency | Precision | Sensitivity | Detection time | Action |
    | :-- | :-- | :-- | :-- | :-- |
    | **High** | Higher | Lower | Shorter | Page |
    | **Low** | Lower | Higher | Longer | Notify |

5. TODO: reset time

- TODO: Building something *really good* often means striving for better than something like an SLO. You might not be happy with the bare minimum of e.g. 99.9% availability. Your customers might not be either. It can be worth considering making your alerts stricter than necessary to encourage you to keep improving reliability or performance. Be careful with page-level alerts though, this is not worth waking people up for, instead it's a job for notification-level alerts. NOTE: Do not impose this on other people/teams!

## Further reading

- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Prometheus - Querying basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Precision and sensitivity](https://en.wikipedia.org/wiki/Precision_and_recall)
