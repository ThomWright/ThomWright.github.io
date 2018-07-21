---
layout: post
title: Correlation IDs in NodeJS
---

Much has already been written about the need for correlation IDs in microservice architectures. If this is a new concept for you, I encourage you to read [_Building Microservices_](http://shop.oreilly.com/product/0636920033158.do) by Sam Newman. Or if you want a quick intro, try [this blog post](http://hilton.org.uk/blog/microservices-correlation-id).

There are three ways I know of to pass a correlation ID around a NodeJS application:

1. continuation-local storage
1. async hooks
1. function arguments

[Continuation-local storage](https://github.com/othiym23/node-continuation-local-storage) is what [New Relic](https://github.com/newrelic/node-newrelic) used for their instrumentation library, before apparently abandoning it for performance reasons. It's pretty magic, and relies on "extensively monkeypatching the core platform" ([quote](https://github.com/othiym23/node-continuation-local-storage/issues/33#issuecomment-288260932)).

[Aync hooks](https://nodejs.org/api/async_hooks.html) are [experimental](https://nodejs.org/docs/latest-v10.x/api/async_hooks.html) at the time of writing (NodeJS v10.7.0). They're also pretty magic! Despite the magic, I think they might soon be the recommended way of solving these problems, but for now I'm going to focus on the 'manual' approach: simple function arguments.

To start with, let's pretend we've written a simple application which handles HTTP requests. It does the following:

- takes a number and an operation from the request
- looks up another number in the database
- performs the operation on the two numbers
- updates the database
- returns the result

Here's what the code might look like.

```js
function add(a, b) {
  console.log(`Adding ${a} and ${b}`)
  return a + b
}

function subtract(a, b) {
  console.log(`Subtracting ${b} from ${a}`)
  return a - b
}

function createDbAccess() {
  let databaseValue = 5
  return {
    async get() {
      console.log(`Getting db val: ${databaseValue}`)
      return databaseValue
    }
    async set(n) {
      console.log(`Setting db val: ${n}`)
      databaseValue = n
    }
  }
}

async function modifyValue(n, op) {
  console.log("Starting")
  const db = createDbAccess()

  const dbVal = await db.get()

  const newVal = op === "add"
    ? add(n, dbVal)
    : subtract(n, dbVal)

  await db.set(newVal)

  console.log("Finished")
  return newVal
}

async function httpHandler(req, res) {
  const x = await modifyValue(
    req.params.number,
    req.params.operation
  )
  res.send(x)
}
```

Some of our functions write some logs. We want these logs to include correlation IDs, so let's try doing that.

## Explicit function arguments

Our first attempt at refactoring this is to take the correlation ID from the request object and pass it around to any functions which need it.

```js
function add(correlationID, a, b) {
  console.log(`Adding ${a} and ${b}`, correlationID)
  return a + b
}

function subtract(correlationID, a, b) {
  console.log(`Subtracting ${b} from ${a}`, correlationID)
  return a - b
}

function createDbAccess() {
  let databaseValue = 5
  return {
    async get(correlationID) {
      console.log(`Getting db val: ${databaseValue}`, correlationID)
      return databaseValue
    }
    async set(correlationID, n) {
      console.log(`Setting db val: ${n}`, correlationID)
      databaseValue = n
    }
  }
}
const db = createDbAccess()

async function modifyValue(correlationID, n, op) {
  console.log("Starting", correlationID)

  const dbVal = await db.get(correlationID)

  const newVal = op === "add"
    ? add(correlationID, n, dbVal)
    : subtract(correlationID, n, dbVal)

  await db.set(correlationID, newVal)

  console.log("Finished", correlationID)
  return newVal
}

async function httpHandler(req, res) {
  const correlationID = req.headers["X-Correlation-Id"]
  const x = await modifyValue(
    correlationID,
    req.params.number,
    req.params.operation
  )
  res.send(x)
}
```

We can think of our functions as being called in a tree. In general I guess it's a directed graph, but a tree will do fine here.

- httpHandler
  - addToStoredValue
    - getFromDatabase
    - add

This tree is tiny, but most real-world applications will have significantly larger function call trees. Manually passing a value all the way from the root (`httpHandler`) to the leaf nodes can get pretty cumbersome.

## 'Constructor' dependency injection

Here, we organise our function into components/modules/classes (or whatever you want). Instead of passing the correlation ID to each function, we pass it to the function which creates the component. Any function in that module then has access to it.

```js
function createCalculator(correlationID) {
  return {
    add(a, b) {
      console.log(`Adding ${a} and ${b}`, correlationID)
      return a + b
    },

    subtract(a, b) {
      console.log(`Subtracting ${b} from ${a}`, correlationID)
      return a - b
    },
  }
}

function createDbAccess(correlationID) {
  let databaseValue = 5
  return {
    async get() {
      console.log(`Getting db val: ${databaseValue}`, correlationID)
      return databaseValue
    }
    async set(n) {
      console.log(`Setting db val: ${n}`, correlationID)
      databaseValue = n
    }
  }
}

function createBusinessLogic(correlationID, db, calculator) {
  return {
    async modifyValue(n) {
      console.log("Starting", correlationID)

      const dbVal = await db.get()

      const newVal = op === "add"
        ? calculator.add(n, dbVal)
        : calculator.subtract(n, dbVal)

      await db.set(newVal)

      console.log("Finished", correlationID)
      return newVal
    }
  }
}

async function httpHandler(req, res) {
  const correlationID = req.headers["X-Correlation-Id"]

  // wire up all dependencies
  const db = createDbAccess(correlationID)
  const calculator = createCalculator(correlationID)
  const logic = createBusinessLogic(correlationID, db, calculator)

  const x = await logic.addToStoredValue(req.params.number)
  res.send(x)
}
```

We can think of our component and their dependencies as a directed acyclic graph (though again a simple tree will do in this case):

- HTTP handler
  - high-level business logic
    - calculator
    - database access

One thing I want to point out here is the 'lifetime' of our components. Before, everything lived for the lifetime of the application. For example, our data access component (`const db = createDbAccess()`) was created at application start, and used for every request.

After this refactoring, the data access component is created in the request handler, and it lives only for the length of the request.

It's important to note that if we were connecting to a real database, we'd want the connection (or connection pool) to have an 'application lifetime', because creating connections is expensive. We'd want to do something like this:

```js
// in scope for the whole lifetime of the application
const dbConnection = createDbConnection()

async function httpHandler(req, res) {
  // in scope only for a single request
  const db = createDbAccess(dbConnection, correlationID)
  // ...
}
```

Here, our database connection lives for the lifetime of the application. Since our data access component requires per-request data (our correlation ID), it lives only as long as the request.

Components should only have dependencies on other components with the same lifetime, or a longer lifetime. A component which needs to live for the lifetime of the application shouldn't depend on something which should only live for the lifetime of a request.

## Separating concerns

Compare these two implementations ofthe business logic:

```js
// manually passing to each function
async function modifyValue(correlationID, n, op) {
  console.log("Starting", correlationID)

  const dbVal = await db.get(correlationID)

  const newVal = op === "add"
    ? add(correlationID, n, dbVal)
    : subtract(correlationID, n, dbVal)

  await db.set(correlationID, newVal)

  console.log("Finished", correlationID)
  return newVal
}
```

```js
// using component dependency injection
async function modifyValue(n) {
  console.log("Starting", correlationID)

  const dbVal = await db.get()

  const newVal = op === "add"
    ? calculator.add(n, dbVal)
    : calculator.subtract(n, dbVal)

  await db.set(newVal)

  console.log("Finished", correlationID)
  return newVal
}
```

The second example has significantly less noise. We've managed to remove almost all mentions of correlation IDs. This means we can write most of our application code without having to worry about passing correlation IDs around. Nice!

If we wanted to take this a step further, we could create a `logger` component using the correlation ID, and pass that in along with the other dependencies. Let's do that now.

```js
function createCalculator(logger) {
  return {
    add(a, b) {
      logger.log(`Adding ${a} and ${b}`)
      return a + b
    },

    subtract(a, b) {
      logger.log(`Subtracting ${b} from ${a}`)
      return a - b
    },
  }
}

function createDbAccess(logger) {
  let databaseValue = 5
  return {
    async get() {
      logger.log(`Getting db val: ${databaseValue}`)
      return databaseValue
    }
    async set(n) {
      logger.log(`Setting db val: ${n}`)
      databaseValue = n
    }
  }
}

function createBusinessLogic(logger, db, calculator) {
  return {
    async modifyValue(n) {
      logger.log("Starting")

      const dbVal = await db.get()

      const newVal = op === "add"
        ? add(n, dbVal)
        : subtract(n, dbVal)

      await db.set(newVal)

      logger.log("Finished")
      return newVal
    }
  }
}

function createLogger(correlationID) {
  return {
    log(s) {
      console.log(s, correlationID)
    }
  }
}

async function httpHandler(req, res) {
  const correlationID = req.headers["X-Correlation-Id"]

  // wire up all dependencies
  const logger = createLogger(correlationID)
  const db = createDbAccess(logger)
  const calculator = createCalculator(logger)
  const logic = createBusinessLogic(logger, db, calculator)

  const x = await logic.addToStoredValue(req.params.number)
  res.send(x)
}
```

There! No more mention of `correlationID` anywhere except the logger, the only place that really needs to know about it.

Removing the correlation ID from our core logic might not seem that important, but as your application size increases and you have more request-scoped variables (e.g. [tracing spans](https://github.com/opentracing/opentracing-javascript) or [deadlines](https://www.datawire.io/guide/traffic/deadlines-distributed-timeouts-microservices/)) this can become increasingly unmanageable.

Our component hierarchy now looks like:

- HTTP handler
  - high-level business logic
    - logger
    - calculator
      - logger
    - database access
      - logger

To wire these up, we start at the leaf nodes (here that's `logger`) and work our way to the root. The bigger your app, the more complicated your wiring. You might want to make this reusable, or even look into dependency injection systems. Personally, I think there are benefits to the explicit wiring shown here. Saying that, at [Candide](https://candide.eu/) we use a library I wrote called [`di-hard`](https://github.com/ThomWright/di-hard) which automatically wires our components together. It's not strictly necessary, but saves some boilerplate.

We also use a [service chassis](http://microservices.io/patterns/microservice-chassis.html) called the `shell`. This gives developers easy access to a logger and HTTP client which already make use of the correlation ID.

This post is long enough already, so I'm going to stop here. The next steps would be to think about how to propagate this correlation ID to another service through e.g. an HTTP request. This is an easy as creating a new `httpClient` component which takes a correlation ID, and wiring it in wherever it's needed.

Once an application is architected this way, adding any other context propagation is much more straightforward. Moving to full [distributed tracing](http://microservices.io/patterns/observability/distributed-tracing.html) is a relatively easy step.

I would strongly recommend using correlation IDs from the beginning if possible. Refactoring them into an existing application is a not a fun job!
