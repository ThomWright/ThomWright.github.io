---
layout: post
title: Typography Test
tags: [test, typography]
toc: true
guest_author:
  name: Me (Thom Wright)
  url: https://thomwright.co.uk
---

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
  img_src="/public/assets/one-second/tcp-race.png"
  caption="A small-width image with a caption"
  size="small"
%}

{% include figure.html
  img_src="/public/assets/one-second/tcp-handshake.png"
  caption="A medium-width image with a caption"
  size="med"
%}

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
