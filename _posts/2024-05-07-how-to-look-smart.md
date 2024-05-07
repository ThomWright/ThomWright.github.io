---
layout: post
title: How to look smart with async messaging
tags: [distributed systems, reliability]
---

When reviewing a design for an asynchronous system, there are some simple questions you can ask.

- What happens if this message is delayed?
- What happens if these messages arrive out of order?
- What happens if this message is processed twice? Concurrently?
- What happens if two related messages are processed concurrently?
- What happens if this message handler fails partway through? Repeatedly?

In my experience, you are likely to find some bugs!

After you find some bugs, take some time to feel good about it then share this blog post with the designers. Next time they can be the ones to look smart!

For techniques to handle these issues, see [failure patterns]({% link failure-patterns.md %}).
