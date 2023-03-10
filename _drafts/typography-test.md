---
layout: post
title: Typography Test
guest_author:
  name: Me (Thom Wright)
  url: https://thomwright.co.uk
---

# Main heading

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

function test() {
  return "hello world"
}
```

<!-- markdownlint-disable-next-line MD040 -->
```
A code block with no language: "string" 0.00
```

```plaintext
A plaintext block quote
```

Some `inline code`.

> A block quote

{% include figure.html
  img_src="/public/assets/one-second/tcp-keepalive-race.png"
  caption="A small image with a caption"
  small="true"
%}

{% assign types = "success info warning alert" | split: " " %}
{% for type in types %}
  {% capture text_content %}
  A call out: *{{type}}*
  {% endcapture %}
  {% include call-out.html
    type=type
    content=text_content
  %}
{% endfor %}

And that's it.
