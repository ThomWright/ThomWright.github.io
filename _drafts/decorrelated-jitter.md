---
layout: post
title: "The problem with decorrelated jitter"
tags: [jitter, algorithms, reliability]
---

Decorrelated jitter has a major flaw: clamping. Retry intervals can get repeatedly clamped to the maximum allowed duration. This can significantly reduce the amount of jitter applied.

For comparison, a standard exponential backoff algorithm is:

```python
sleep = min(max_duration, min_duration * 2 ** attempt)
```

With "full jitter", this turns into:

```python
sleep = random_between(0, min(max_duration, min_duration * 2 ** attempt))
```

Whereas "decorrelated jitter" is this:

```python
sleep = min(max_duration, random_between(min_duration, prev_sleep * 3))
```

Let’s break this down into two parts:

```python
# First: increase the sleep value by multiplying it - can produce at most 3x max_duration
temp = random_between(min_duration, prev_sleep * 3)

# Second: clamp it
sleep = min(max_duration, temp)
```

The `sleep` duration will generally increase every iteration. With this algorithm, when the previous `sleep` grows as large as `max_duration` there is only a 1/3 chance of applying jitter. E.g.:

```python
max_duration = 10
min_duration = 1

prev_sleep = 10

# From 1 - 30
temp = random_between(1, 10 * 3)

# From 1 - 10
sleep = min(10, temp)
```

This isn't great. In this case, 2/3 of the time the sleep will simply be the `max_duration`.

One way to work around this is to make sure that you won’t hit this maximum by keeping the number of retries small, and the maximum duration sufficiently high. But this is likely to surprise many people. It's probably better to use another algorithm.

## Further reading

- [AWS Architecture: Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
