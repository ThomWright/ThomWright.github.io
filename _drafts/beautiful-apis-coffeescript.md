---
layout: post
title: Beautiful APIs in CoffeeScript
---

Let's say we want to make a maths library in CoffeeScript (e.g. a [Matrix library](github.com/ThomWright/matrixy)). We could easily write an API for addition that looks like:

```coffeescript
nine = four.plus five
```

But what if we want to do this:

```coffeescript
nine = four plus five
```

I know it's only removing a `.`, but I think it looks a bit nicer. Let's see how to do it.

First thing to note is that this relies on some of CoffeeScript's syntactic sugar. With brackets, the code is:

```coffeescript
nine = four(plus(five))
```

Not exactly pretty, but it allows us to more clearly see what's going on.

We can see that our numbers need to be functions that take in whatever the result of `plus(five)` is. Let's create one of these numbers like so:

```coffeescript
makeNumber = (number) ->
  (op) ->
    # Do addition

four = makeNumber 4
console.log four # [Function]
```

*(Ideally we'd be writing tests for this stuff before implementing it. Instead I'm using `console.log`. Let's call this, uh... Log-Driven Development (LDD))*

Whatever the result of `plus(five)` is, it's going to need the other number (`four`) to do the addition. Let's implement that now.

```coffeescript
makeNumber = (number) ->
  (op) ->
    op number
```

Now that's done, let's have a go at implementing the `plus` function.

```coffeescript
plus = (number) ->
  (otherNumber) ->
    number + otherNumber
```

Only, this won't work. Why not? Well, have a look at the types of `number` and `otherNumber`. `number` is something we created with the `makeNumber` function. A 'wrapped number' if you will. `otherNumber` is just a normal number.

How do we add these? We need to 'unwrap' `number`. Let's do this by calling the wrapper with no argument e.g. `four()`. This can be implemented like so:

```coffeescript
makeNumber = (number) ->
  (op) ->
    op?(number) or number

four = makeNumber 4
console.log four() # 4
```

And refactor our `plus` function:

```coffeescript
plus = (number) ->
  (otherNumber) ->
    number() + otherNumber
```

Something's not quite right about this though. Feels a bit asymmetrical. How about if both `number` and `otherNumber` were both wrapped? Let's try it.

```coffeescript
makeNumber = (number) ->
  wrapper = (op) ->
    op?(wrapper) or number

plus = (number) ->
  (otherNumber) ->
    number() + otherNumber()
```

Note how we pass the `wrapper` into `op` in `makeNumber`.

OK, looking good! Let's put it together and give it a go:

```coffeescript
makeNumber = (number) ->
  wrapper = (op) ->
    op?(wrapper) or number

four = makeNumber 4
five = makeNumber 5

plus = (number) ->
  (otherNumber) ->
    number() + otherNumber()

nine = four plus five
console.log nine() # 9
```

Last thing to do is to make `plus` return a wrapped number, to keep everything in our nicely wrapped format:

```coffeescript
plus = (number) ->
  (otherNumber) ->
    makeNumber number() + otherNumber()
```

We can easily extend this to other operations, such as multiplication:

```coffeescript
makeNumber = (number) ->
  wrapper = (op) ->
    op?(wrapper) or number

four = makeNumber 4
five = makeNumber 5

plus = (number) ->
  (otherNumber) ->
    makeNumber number() + otherNumber()

times = (number) ->
  (otherNumber) ->
    makeNumber number.get() * otherNumber()

nine = four plus five
twenty = four times five
console.log nine() # 9
console.log twenty() # 20
```

We can even extend it to something like vector addition:

```coffeescript
makeNumber = (number) ->
  wrapper = (op) ->
    op?(wrapper) or number

fours = makeNumber [4, 4]
fives = makeNumber [5, 5]

vPlus = (vector) ->
  (otherVector) ->
    r = []
    for v, i in vector()
      r[i] = v + otherVector()[i]
    makeNumber r

nines = fours vPlus fives
console.log nines() # [9, 9]
```

And there we have it. A beautifully readable (IMHO) API in CoffeeScript.

Now, why would anyone go to all this effort just to remove the `.`? I'll be honest, I did it simply because it looks nice.

To my surprise though, it also creates a very flexible API that works for many operands (e.g. numbers, vectors) and allows pluggable user-supplied operations (addition, multiplication...).

My only wish is for some kind of type system to check for silly things like using `vPlus` with ordinary numbers at compile time. Oh well. Maybe I should use [TypeScript](http://www.typescriptlang.org/)...
