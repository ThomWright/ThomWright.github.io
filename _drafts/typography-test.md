---
layout: post
title: Typography Test
tags: [test, typography]
---

<!--markdownlint-disable MD033 MD059-->
Some intro text with a [link](https://google.com).

## Sub-Heading

This is text with some *italics*.

### Sub-Sub-Heading

This is text with some **bold**.

#### Sub-Sub-Sub-Heading

A simple unordered list:

- item
- another item

And an ordered list:

1. Apples
2. Oranges

```typescript
const typescript = "code"

// Long and scrollable
const randomInteger = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

function test() {
  return `Hello world ${randomInteger(1, 10)}`
}
```

Introducing a code block:

<!-- markdownlint-disable-next-line MD040 -->
```
A code block with no language: "string" 0.00
```

```plaintext
A plaintext code block
```

Some `inline code`.

Introducing a quote:

> A block quote

{% include figure.html
  img_src="/public/assets/retries/1-perfect-latencies.png"
  caption="A small-width image with a caption"
  size="small"
%}

{% include figure.html
  img_src="/public/assets/pools/connections_3.png"
  caption="A medium-width image with a caption"
  size="med"
%}

## Tables

A comparison table:

<div class="table-wrapper" markdown="block">

|              | Offset                                                      | Cursor                        |
|--------------|-------------------------------------------------------------|-------------------------------|
| Stable pages | ❌ No                                                       | ✅ Yes                        |
| Efficiency   | `O(offset + limit)`                                         | `O(limit)`                    |
| Notes        | A longer cell, which should wrap onto more than one line    | [A link](https://example.com) |

</div>

A table of numbers, right-aligned:

<div class="table-wrapper" markdown="block">

| Pool size | Requests per second | p99 latency (ms) |
|-----------|--------------------:|-----------------:|
| 10        |               1,240 |              8.5 |
| 100       |              11,800 |             41.0 |
| 1,000     |              96,500 |            310.2 |

</div>

A wide table, which scrolls sideways:

<div class="table-wrapper" markdown="block">

| Pool size | Requests per second | p50 (ms) | p75 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | p99.9 (ms) | Max (ms) | Errors per second | Timeouts per second |
|-----------|--------------------:|---------:|---------:|---------:|---------:|---------:|-----------:|---------:|------------------:|--------------------:|
| 10        |               1,240 |      2.1 |      3.4 |      5.8 |      6.9 |      8.5 |       14.2 |     31.0 |              0.01 |                0.00 |
| 100       |              11,800 |      4.7 |      9.3 |     21.6 |     28.4 |     41.0 |       88.9 |    204.5 |              0.40 |                0.12 |
| 1,000     |              96,500 |     38.2 |     71.5 |    160.3 |    221.7 |    310.2 |      702.6 |  1,480.9 |             12.80 |                4.35 |

</div>

## Diagrams

{% include diagram.html
  name="recovery-point"
  caption="A sequence diagram"
%}

{% include diagram.html
  name="outbox-int-pub"
  caption="A box diagram"
%}

{% include diagram.html
  name="saga"
  caption="A state diagram"
%}

{% include diagram.html
  name="pg-locks-example"
  caption="A timeline"
%}

## Callouts

{% assign types = "aside success info warning alert" | split: " " %}
{% for type in types %}
  {% capture text_content %}
  A call out: *{{type}}*
  {% endcapture %}
  {% include callout.html
    type=type
    content=text_content
  %}
{% endfor %}

And that's it.
