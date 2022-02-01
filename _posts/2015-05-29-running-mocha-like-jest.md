---
layout: post
title: Running Mocha in __tests__ directories
---

I don't know about you, but I quite like the [Jest](https://facebook.github.io/jest/) convention of putting tests in `__tests__` directories. It keeps the tests local to the modules they're testing, and visible in the `src` directory, rather than hidden away in `test`. I know, it's the little things.

Anyway, here's how to achieve that with [Mocha](https://mochajs.org/), my test runner of choice. Just stick the following in your `package.json` scripts:

```json
"mocha": "find ./src -wholename \"./*__tests__/*\" | xargs mocha -R spec"
```

Inspired by [this Gist](https://gist.github.com/timoxley/1721593).

**EDIT** - Alternatively, this is much simpler and seems to work:

```json
"mocha": "mocha 'src/**/__tests__/*' -R spec"
```
