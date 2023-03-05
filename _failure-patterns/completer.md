---
layout: pattern
title: Completer
short: completer
group: background-processes
tagline: Complete unfinished operations, even if clients give up retrying
---

TODO:

From [https://brandur.org/idempotency-keys](https://brandur.org/idempotency-keys)

- a helping hand with Resumable operations
- store request in event log before processing
- clients might give up retrying and leave unfinished operations lying around
- the completer finds these and drives them to completion

## Also known as

[Active recovery](https://www.lpalmieri.com/posts/idempotency/#10-3-forward-recovery)
