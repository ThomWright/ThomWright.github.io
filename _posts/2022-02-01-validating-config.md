---
layout: post
title: Validating configuration with io-ts
canonical: https://candide.com/GB/stories/70d34740-5130-4b1a-8971-ef60082036ba
tags: [microservices, reliability, types]
---

Something I wrote at Candide about how we ensured our services didn't get deployed with invalid configuration.

## Background

At [Candide](https://candide.com) we use a microservice architecture of Node.js services written in TypeScript, running on Kubernetes. Here we'll explore how we ensure our services don't run with invalid configuration.

## Example service

Let's consider a simple [Express](https://expressjs.com/en/starter/hello-world.html) service:

```typescript
import * as express from "express";

const port = 3000;

const app = express();
app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

Say we want to configure two aspects of this service, which might vary per-environment:

- the **port** to listen on
- the **response** to send

We could write it like so:

```typescript
import * as express from "express";

const port = process.env.EXAMPLE_PORT;

const app = express();
app.get("/", (req, res) =>
  res.send(process.env.EXAMPLE_RESPONSE.toUpperCase())
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

Which would work, but there are several problems with this approach. Let's address some of them individually.

## Missing values

If we forget to supply the `EXAMPLE_PORT` environment variable, `port` will be `undefined`.

You might be tempted to think that if we supply `undefined` for the port then Express would refuse to start. [Nope](https://expressjs.com/en/4x/api.html#app.listen):

>If port is omitted or is 0, the operating system will assign an arbitrary unused port

So our server will start, but on an arbitrary port. Probably not very useful. Chances are there are clients attempting to connect to this server on a specific port, which will now fail to do so.

At Candide, we would probably catch this pretty quickly. Kubernetes will try to send health check requests to the service, which would fail. But we wouldn't want to rely on this.

Let's put in a check to ensure we haven't forgotten to supply the port:

```typescript
import * as express from "express";

const port = process.env.EXAMPLE_PORT;

if (port == null) {
  throw new Error("Required config: EXAMPLE_PORT");
}

const app = express();
app.get("/", (req, res) =>
  res.send(process.env.EXAMPLE_RESPONSE.toUpperCase())
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

Now, if we try to launch the service without a port, it will fail to start. The sooner we fail, the sooner we can find and fix the issue. Having a specific error emitted from this service (rather than from client services) makes it much quicker and easier to debug what the error is.

What if we forget to supply `EXAMPLE_RESPONSE`? Well, again, the server will start just fine, but every request to that endpoint will error. We won't see any problems until traffic has already started reaching the service. Doing a check at start-up will make sure we fail before starting to receive traffic. Since we run on Kubernetes, no traffic will be routed to the service until it's ready.

Let's refactor like so:

```typescript
import * as express from "express";

const port = process.env.EXAMPLE_PORT;
const responseText = process.env.EXAMPLE_RESPONSE;

if (port == null) {
  throw new Error("Required config: EXAMPLE_PORT");
}
if (responseText == null) {
  throw new Error("Required config: EXAMPLE_RESPONSE");
}

const app = express();
app.get("/", (req, res) => res.send(responseText.toUpperCase()));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

## Incorrect type

OK, now we're checking that we have all of the required config values. But what happens if the port is not an integer?

Let's say we set `EXAMPLE_PORT=eighty`, we might expect Express to reject that because it's obviously not a valid port number.

Instead, when running it, we see: `Example app listening on port eighty!`.

Oh.
If you run `ls -ld *`, you might see something like:

```plaintext
$ ls -ld *
srwxrwxr-x  1 thom thom     0 Mar  4 17:27  eighty=
```

See that `s` before the file permissions? That means this is a [Unix socket](https://en.wikipedia.org/wiki/Unix_file_types#Socket). Under the covers, Express is using the Node.js net package, which provides [IPC support](https://nodejs.org/api/net.html#net_ipc_support).

This _probably_ isn't what we wanted. Again, the server appears to start up fine, but nothing will be able to connect.

Let's do some more validation to make sure the port is something valid:

```typescript
import * as express from "express";

const portVar = process.env.EXAMPLE_PORT;
const responseText = process.env.EXAMPLE_RESPONSE;

if (portVar == null) {
  throw new Error("Required config: EXAMPLE_PORT");
}
if (responseText == null) {
  throw new Error("Required config: EXAMPLE_RESPONSE");
}

let port;
try {
  port = parseInt(portVar, 10);
} catch (error) {
  throw new Error("EXAMPLE_PORT is not an integer");
}

if (port < 0 || port > 65535) {
  throw new Error("EXAMPLE_PORT is out of range");
}

const app = express();
app.get("/", (req, res) => res.send(responseText.toUpperCase()));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

Now we'll fail early if `EXAMPLE_PORT` isn't supplied or is invalid. Great.

## Using io-ts

We can take this a step further using the excellent `io-ts` [library](https://github.com/gcanti/io-ts).

Here is an example that uses `io-ts` to validate the config, convert the port to an integer, and give us a well-typed object we can pass around to the rest of our service.

```typescript
import * as express from "express";
import * as t from "io-ts";
import { IntFromString } from "io-ts-types/lib/IntFromString";
import { failure } from "io-ts/lib/PathReporter";

type Config = Readonly<{
  port: number;
  responseText: string;
}>;

const IOEnv = t.type({
  EXAMPLE_PORT: IntFromString,
  EXAMPLE_RESPONSE: t.string
});

const decodedConfig = IOEnv.decode(process.env).map(
  (env): Config => ({
    port: env.EXAMPLE_PORT,
    responseText: env.EXAMPLE_RESPONSE
  })
);

if (decodedConfig.isLeft()) {
  throw new Error(
    "Config validation errors: " + failure(decodedConfig.value).join("\n")
  );
}

const config: Config = decodedConfig.value;

const app = express();

app.get("/", (req, res) => res.send(config.responseText.toUpperCase()));

app.listen(config.port, () =>
  console.log(`Example app listening on port ${config.port}!`)
);
```

In a larger service, we would extract the config validation into its own module. The rest of the service would use the `Config` object to access configuration, rather than `process.env` directly. In fact, we could use this [ESLint rule](https://eslint.org/docs/rules/no-process-env) to disallow direct use of `process.env` if we wanted.

For more on configuration, see [The Twelve-Factor App](https://12factor.net/config).
