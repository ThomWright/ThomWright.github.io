---
layout: post
title: TCP state transitions are a lie
---

Everyone seems to be participating in some weird lie about the LISTEN > SYN-RECEIVED state transition in TCP. I feel very left out and I wish someone would tell me what is going on.

Let me explain what I mean.

This is from the original [TCP RFC, pages 65-66](https://tools.ietf.org/html/rfc793#page-65), describing what happens when a SYN segment arrives:

> If the state is LISTEN then ... The connection state should be changed to SYN-RECEIVED. If the listen was not fully specified (i.e., the foreign socket was not fully specified), then the unspecified fields should be filled in now.

To me, this means that you start with a socket in the LISTEN state. Then, when a SYN arrives, that socket transitions to a SYN-RECEIVED state. It's shown that way in the state diagram. If I start with one socket, how many sockets would I expect after this state transition? One. If it then moves to ESTABLISHED, would I be able to connect again? No: there is no socket left in the LISTEN state.

This is, as I'm sure is obvious to many, not how it works.

To demonstrate, let's create a listening TCP socket using `nc -l 4433`, and have a look at the 'connection' (it's not really a connection is it, it isn't connected to anything) using `netstat -tan`.

```txt
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:4433            0.0.0.0:*               LISTEN
```

Now, if we use `nc 127.0.0.1 4433` to connect to it, we see original LISTEN socket, plus a new ESTABLISHED connection. And also the client end of the connection, but you get the idea. The original socket is still there.

```txt
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:4433            0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:39770         127.0.0.1:4433          ESTABLISHED
tcp        0      0 127.0.0.1:4433          127.0.0.1:39770         ESTABLISHED
```

I'm struggling to work out if this difference is because I'm misinterpreting the RFC, or if there's a functional difference between the RFC and real implementations. Or, perhaps this has been clarified in later versions of the RFC (the original is from 1981). I haven't found anything yet to suggest this.

My usual expectation of course is that I haven't understood the RFC. Maybe I've taken the concept of a 'state transition' a bit too narrowly. However, I've read this a fair few times, and I still don't see how I would read the above quote to mean _make a new socket and leave the original intact_.

Everything I read about TCP seems to be written in terms of either the RFC (maintaining the fiction of the state transition) or the Linux Socket API (which seems to work differently). I haven't found much which connects the two.

Tracing the history of TCP is also not easy. I haven't seen any relevant errata or subsequent modifications to this part of the RFC. Nothing to make me think this has changed, or been clarified since the original RFC. It is, of course, possible that I've missed something.

Is this a normal thing to be confused about when reading this RFC? I haven't found anyone else complaining about it. Maybe I need to look harder.

This should probably be a StackOverflow post or something, but I'm going to just leave it here for now and see how I get on.

**EDIT:** A friend sent me [this paper](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-624.pdf) (thanks Kathryn!) which includes the quote:

> The traditional diagrams have transitions involving two different sockets, e.g. from LISTEN to SYN RECEIVED where a SYN RECEIVED socket is created in response to a SYN received by a LISTEN socket.

So it seems I'm not going mad. The RFC is just misleading. So it goes.
