---
layout: post
title: NODE_ENV
---

Imagine you were writing a function which parsed some markdown.

```typescript
// Option A
type parse = () -> Markdown

// Example use:
global.markdownText = "# Some markdown"
const result = parse()

// Option B
type parse = (markdown: string) => Markdown

// Example use:
const result = parse("# Some markdown")
```

Which of these two options would you use? Why?

- TODO: _why_ is Option A so bad?

Now, let's say we go for option B.

```typescript
// Option A
type parse = (markdown: string) => Markdown;

// Example use:
global.cacheMarkdown = true;
const result = parse("# Some markdown");

// Option B
type parse = (
  markdown: string,
  { cache: boolean /* Default: false */ }
) => Markdown;

// Example use:
const result = parse("# Some markdown", { cache: true });
```

Option A is still bad for the same reasons.

OK, how about this:

```typescript
// Option A
type parse = (markdown: string) => Markdown;

// Example use:
// Might cache, depends on process.env.NODE_ENV
// Also, might do verbose logging. Again, depends on process.env.NODE_ENV
const result = parse("# Some markdown");

// Option B
type parse = (
  markdown: string,
  {
    cache: boolean /* Default: false */,
    verboseLogging: boolean /* Default: false */,
  }
) => Markdown;

// Example use:
const result = parse("# Some markdown", { cache: true, verboseLogging: true });
```

Consider Option A.

What if we wanted to change the cache settings without the log level? Not possible.

What if we wanted _some_ calls to `parse` to cache? Not possible. At least, not without monkey-patching `process.env.NODE_ENV` before and after every call.

What if I want to change the markdown parser configuration without affecting any other libraries which happen to also use `NODE_ENV`? Have fun.

This is not a good design. Why do we do this to ourselves?

Now, what about using `process.env.NODE_ENV` to set _defaults_? It's better, but I'd still rather we didn't.

```typescript
const result = parse("# Some markdown", {useDefaults: "production"})
```

What I see this leading to is people thinking that `NODE_ENV` is the way to configure their services.

Configuration options aren't independently configurable. The only combinations are the presets for `development` and `production`. `development` is probably the default, for convenience. It's probably aso insecure.
