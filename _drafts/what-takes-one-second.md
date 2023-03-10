---
layout: post
title: 'What takes one second?'
---

<!-- markdownlint-disable MD036 MD033 -->

I've had an interesting debugging challenge recently, investigating strange latencies in several services. One symptom I've observed is outgoing requests taking one second longer than usual. Why one second?

There didn’t seem to be anything in our applications themselves which would cause this. No suspicious timeouts, retries, locks or weird sleeps.

I tried Googling around to find what could possibly cause these strange one second latencies, including variations on:

- one second timeout
- 1000 millisecond timeout
- single second delay
- 1000ms network latency

And probably more with no luck.

I’d given up and moved on, but recently found another instance of this strange phenomenon! Chatting to a colleague, I finally discovered there is indeed a common culprit for one second latencies: **SYN retransmission**.

SYN packets are the first packet sent as part of the TCP three-way handshake. The Linux kernel has a default timeout of [one second](https://github.com/torvalds/linux/blob/2fcd07b7ccd5fd10b2120d298363e4e6c53ccf9c/include/net/tcp.h#L144) after which it will retry by sending another SYN packet.

Mystery solved!

Well, partly. The question still remains: why was it taking so long to get a SYN ACK back? I don’t know yet.

Listening TCP sockets have a [SYN queue](https://blog.cloudflare.com/syn-packet-handling-in-the-wild/#synqueue). SYN packets wait here until an ACK comes back from the client to complete the three-way handshake. There an also an Accept queue, where initiated connections wait to be accepted by the application.

If the Accept queue fills up, new incoming SYNs and ACKs will be dropped. If the SYN queue fills up, [SYN Cookies](https://blog.cloudflare.com/syn-packet-handling-in-the-wild/#synflood) can be used (and are enabled by default in the kernel).

Given that, some possible explanations include:

1. The SYN queue on the remote host was full. In which case either we’d expect to see SYN Cookies being used, or the remote isn't using SYN Cookies.
2. The Accept queue on the remote was full.
3. Something in the network was slow for some reason, and delayed either the outgoing SYN or incoming SYN ACK. In which case, we’d expect to see similar delays for packets _other_ than SYN or SYN ACK.
4. Something in the network was dropping packets for some reason. Again, we’d expect to see correlated packet loss across all packet types.
5. Something else I haven't considered.

I don't think it was 1, because we didn't see any SYN Cookies. We _did_ see some strange delays in other incoming and outgoing packets, so currently I'm thinking 3 is most likely, but that just raises more questions. 2 could be possible, but in some cases we're connecting to Cloudflare and I'm pretty sure they can handle this amount of traffic.

That said, I did find something else interesting: we were making _way more connections_ than we should have been. The application was supposed to be using TCP connection pooling, but after almost every request the connection was being closed by our app with a RST.

For most requests this application doesn’t care about response bodies. It does a POST to create the thing, gets a 200/201 status in response and off it goes. However, when [`hyper`](https://github.com/hyperium/hyper) sees that the HTTP response body hasn’t been consumed, instead of returning the connection to the pool it will shut down the connection. If this body data (well, any data) is still in the TCP receive buffer, then the socket will send a RST instead of a FIN. Today I learned.

So for now, a mitigation is to fix the TCP connection pooling and re-use the connections.

TCP connection reuse isn’t without its own potential problems, such as the classic keepalive race condition. This tends to happen when the client and server both have the same keepalive timeout durations. If the client sends a new request just before the timeout fires, but the server receives the request _after_ its own timeout fires, then we have a problem. We can mitigate this by setting the server’s timeout to a suitably higher value than the client’s, but this becomes harder when you don’t control both!

{% include figure.html
  img_src="/public/assets/one-second/tcp-keepalive-race.png"
  caption="TCP keepalive race condition"
  small="true"
%}

It seems to be helping though.

The investigation continues.

## Further reading

- [SYN packet handling in the wild](https://blog.cloudflare.com/syn-packet-handling-in-the-wild/)
- [When TCP sockets refuse to die](https://blog.cloudflare.com/when-tcp-sockets-refuse-to-die/)
- [RFC 9293 - Transmission Control Protocol (TCP)](https://datatracker.ietf.org/doc/rfc9293/)
