---
layout: post
title: Why Rust?
tags: [language, rust, types]
---

<!-- begin_excerpt -->
Rust is, for me, the best language for backend development I’ve used in my 10+ year career.

Emphasis on *for me*.

To explain why, it'll help to share some context on what I do and what I value.
<!-- end_excerpt -->

## About me

I started programming at university with C, some assembly, Matlab and finally Java, which was my first experience with a language that felt like it was actually *helping* me. The compiler error messages actually pointed at the correct lines, whereas in C I would spend ages wondering how I could possibly have screwed up line 30, only to find the error was several lines above. And unlike Matlab, it was easy to figure out what types I should pass to methods. Hover mouse over method, see parameter types and Javadoc comments. Simple things, right? But these were an important part of what turned me on to writing software for a living. Before that, it just seemed awful.

Most of my  development work has been in TypeScript, JavaScript and Java. I was first introduced to functional programming with Scala. I’ve also dabbled in Haskell, and used C#, Python, Go and PHP here and there. And [Bash](https://github.com/ThomWright/bash-resources), for my sins. For the past year or so I've been using Rust full time.

My career to date has been mostly full stack web development, starting with an emphasis on frontend and moving backwards over time. I now work almost entirely on backend services, and prefer working in environments where observability, correctness, reliability and performance are valued (somewhat in that order). Speed of iteration is still important, so the challenge is to move fast without breaking things.

### What do I like in a language?

**A powerful type system**, so I can shift cognitive load onto the computer. I don't work well on codebases where I need a global mental model of the entire project just to make a local change to a function signature. If I make a change like that a computer can very quickly check everything for me. First, this is a big saver in terms of time and cognitive effort, and second it’s very freeing, allowing me to confidently make more daring refactorings.

I make many mistakes in dynamically typed languages, and a good type system catches a high proportion of these. I don’t find unit tests particularly helpful for these kinds of errors. In fact, I generally consider writing and maintaining these kinds of tests to be [toil](https://sre.google/sre-book/eliminating-toil/). Unit tests can be great in many cases, but the cost benefit ratio is often much worse than using a few types and a good type checker.

I often refactor, for which my development workflow is: make a small change, fix all compiler errors, commit. I also want to be able to encode certain constraints using the type system, for example using the **"new type" idiom** where a function can take a `Seconds` type instead of just a number. [Make illegal states unrepresentable](https://blog.janestreet.com/effective-ml-revisited/), [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) etc.

In that vein, I like algebraic types. **Sum types** in particular I find hard to live without. Not being able to express fundamental concepts like optional values feels wrong. No nulls please. If they do exist, I'm much happier if they're at least trackable by the compiler. **Pattern matching** similarly can feel conspicuous in its absence.

As well as optional values I want fallible operations encoded into types, and **ergonomic error handling**. If something can go wrong, don't hide it from me. A language that encourages thorough consideration of error cases while not being too verbose is what I'm looking for. This can do wonders not only for my own code, but also the whole underlying ecosystem of libraries I build on. The culture around error handling is influenced by the language, and can pervade the whole ecosystem.

Speaking of which, I am drawn to an **ecosystem and community** which values inclusivity, pedagogy, documentation, correctness, transparency, rigour and continual improvement. That's a lot, but building something quality takes a lot of work, from many types of people. To make something *really* good takes a dedication to pursuing ideals, sharing ideas and having them respectfully challenged. I want something *really good*.

A big part of working as a developer is learning. A focus on education and [documentation](https://doc.rust-lang.org/std/future/trait.Future.html) means I can pick up new concepts and libraries easier, and so can everyone else. I prefer to learn and understand fundamental concepts than platform-specific abstractions. A community of people who feel similarly and take the time to teach others is invaluable to me. There’s also a good chance that at some point I’ll need to look under the covers and dig around, either to fully understand something or to debug an issue. This shouldn’t be required, but certainly possible and even encouraged.

**A helpful compiler**. This builds on the previous point: a compiler which can clearly show my errors, explain what the problem is and how to fix it (or maybe fix it automatically!) is a wonderful experience. Computers can be quite good when we try hard to make them so. My first programming experience was in C, and this was a good lesson in how frustrating poor compiler messages can be.

More generally: **tooling**. The install process, dependency management, compiler/runtime version management, linting, formatting, all that stuff. I want it to work, I want it to be easy.

{% include callout.html
  type="aside"
  content="I cannot tell you how frustrated Python and Ruby make me in this regard. Every time I use them I want to throw the laptop out of the window before I can even write or edit any code. Somehow it just never works. No, I don’t want to manage virtual environments, thank you very much. Get out of my way."
%}

A good mix of **imperative and functional** styles. A focus on **immutability**, good support for **closures** and **higher-order functions**. A lot of code is more easily expressed in one paradigm or another, and immutability really helps reduce the number of possible ways I can screw up, making development and debugging much faster.

Lastly, a flexible **module system**. I like structure, and I like being able to group functionality and scope access at multiple levels. Having a single way to structure this (e.g. classes) just feels too limiting. I want larger constructs to group systems together, and to do this recursively. I don't want to need to create a library just to hide some implementation details from the rest of my application. The language itself should facilitate this.

## My experience with Rust

I guess it's no surprise that I think Rust excels in all of these areas.

In fact, by using Rust I learned more about what I want from a language, because it gave me qualities I didn't know were possible. A low-level language where the compiler *actively teaches me* instead of making me feel like an idiot? Where people invest incredible effort into teaching the language and the concepts underlying it, rather than sparse, opaque, ambiguous documentation which exists... somewhere? A self-updating toolchain with version management, dependency management and a bunch of other great stuff built in which just works? A community unsatisfied with the status quo who are on a mission to make things better? I am not used to this.

I am used to many parts of programming being frustrating. You might have guessed from my little rants about compiler errors and Python dependency management. Perhaps I am easily frustrated, but with Rust I just don't feel that as often. I feel more relaxed. It's set up for me to succeed. I can't express how good this feels.

I have learned a lot from the Rust community since first getting interested. Many concepts, projects or types of systems can seem unapproachable, but now [low-level concurrency](https://marabos.nl/atomics/), [TCP implementations](https://www.youtube.com/watch?v=bzja9fQWzdA) and [memory layout](https://fasterthanli.me/articles/whats-in-the-box) don't seem quite so daunting.

"Rewrite it in Rust" has become a pejorative meme, and I understand why. But to me it represents the idea that things can be better, and we can make it happen if we try hard enough. We can live in a world where we don't have memory safety CVEs, where high performance is expected by default. It takes effort, but progress can be made. Rust is not a silver bullet, but it is quite good, and I believe it is simply better than a lot of what came before it.

I think this is borne out in the many superb Rust projects and libraries we see today. I’ll call out [`ripgrep`](https://github.com/BurntSushi/ripgrep), the [Linkerd proxy](https://github.com/linkerd/linkerd2-proxy), [`clap`](https://docs.rs/clap/latest/clap/), [`serde`](https://serde.rs/) and [`sqlx`](https://github.com/launchbadge/sqlx) as some examples I’ve really enjoyed using.

Note that I haven't mentioned anything about performance or (lack of) garbage collection. These are important aspects of the language for sure, but they're not why I use it. I love that I get something that is fast and uses low CPU and memory without having to really think about it, but that's just a bonus.

There's a good argument to be made for "letting the computer do the work" of managing memory, much like type checking, both in terms of reducing cognitive load and preventing mistakes. I certainly wouldn't want to do it manually without a computer checking if I've done it correctly. With the help of the compiler, and after developing a *good enough* mental model of how to structure code, any additional cognitive load feels like a small price to pay.

In fact, for some reason I quite like not having a garbage collector. It makes loads of sense to use one for high-level languages, but I don't find myself missing it. After a year of using Rust full time, I don't think I've experienced any project being delayed by complexities introduced by lack of garbage collection. Perhaps I'm biased and I just don't see how much longer everything takes, but I don't feel any slower than I was with other languages.

Admittedly, writing `.clone()` a lot gets a bit tiresome, but it's almost mechanical at this point. I find people (myself included) can have a strange aversion to boxing, even in application code where it makes no difference. I do occasionally think "how can I avoid boxing this?" before remembering that it doesn't matter.

For me, development is not a sprint. I prefer to work at a sustainable pace, avoid frustrations, and be encouraged to think where it matters. Rust gives me most of what I want here.

### What are the problems?

Of course, not everything is perfect and it's not a language for everyone. I'll do my best to offer a perspective on what isn't so good.

First, **slow compile times**. Feedback cycles can feel a bit too long, both waiting for `cargo check` to finish and for tests to compile. Honestly, I don’t find this to be a big problem, the trade-off is worth it for me, but it might bother you.

There are still some **rough edges**, e.g. `async fn`s in traits. This particular example is fairly trivial to work around in application code using [`async-trait`](https://crates.io/crates/async-trait), but I'm sure there are others I can't think of right now. Perhaps I've just got used to them.

The big one: the common perception is that **Rust is hard**. This is fair, though I would prefer to express it as having **a steep learning curve**. The former makes it seem accessible to only a few, while the latter suggests anyone can learn it with some effort.

There are many concepts which will be unfamiliar to many. The memory management which involves thinking about lifetimes, ownership, borrowing, references, the stack and the heap. If you're coming from JavaScript then multithreaded concurrency might be new. Even in other languages, we often work in thread-per-request contexts. The async model is novel (or it was to me, coming from JavaScript) and can take some getting used to.

As a specific example, imagine someone coming from a language like Java who wants to [return a trait](https://doc.rust-lang.org/rust-by-example/trait/dyn.html) instead of a concrete type. They might reasonably get frustrated when writing something like this:

```rust
pub trait SomeInterface {}
pub struct ConcreteImpl {}
impl SomeInterface for ConcreteImpl {}

pub fn example() -> SomeInterface {
    ConcreteImpl {}
}
```

Only for it not to compile:

```text
error[E0782]: trait objects must include the `dyn` keyword
 --> src/example.rs:7:21
  |
7 | pub fn example() -> SomeInterface {
  |                     ^^^^^^^^^^^^^
  |
help: add `dyn` keyword before this trait
  |
7 | pub fn example() -> dyn SomeInterface {
  |                     +++

For more information about this error, try `rustc --explain E0782`.
```

So they do what the compiler says and get another error. This time using `impl SomeInterface` is suggested, which compiles. But then they try to return another implementation as well, and get yet another error. Returning `Box<dyn SomeInterface>` finally fixes it.

Again, the compiler is *excellent*. It shows the problem, offers a solution, and links to relevant material to understand what's going on. Running `rustc --explain E0746` (suggested after the second error) is especially helpful. But it doesn't hide the fact that the programmer needs to understand:

- [The stack and the heap](https://doc.rust-lang.org/stable/book/ch04-01-what-is-ownership.html#the-stack-and-the-heap), and that data on the stack must have a known size.
- What [trait](https://doc.rust-lang.org/reference/types/trait-object.html) [objects](https://doc.rust-lang.org/book/ch17-02-trait-objects.html#using-trait-objects-that-allow-for-values-of-different-types) are.
- Possibly what [object safety](https://doc.rust-lang.org/reference/items/traits.html#object-safety) is.
- The [`impl Trait`](https://doc.rust-lang.org/book/ch10-02-traits.html#returning-types-that-implement-traits) syntax.
- What [dynamic dispatch](https://doc.rust-lang.org/book/ch17-02-trait-objects.html#trait-objects-perform-dynamic-dispatch) is.

Requiring this much understanding really affects the initial experience of using the language. Personally, I enjoyed the experience of the compiler teaching me as I went. I think it’s made me a better engineer. There was an up-front cost which I see as an investment. But not everyone will see it this way.

I'd say after investing time in learning the language, I've found application development to rarely be more challenging than other high-level languages. My experience though is that Rust libraries tend to drop down to the [low-level register](https://without.boats/blog/patterns-and-abstractions/) more often than in other languages, and this is where it gets tricky.

Writing [`Future`s](https://doc.rust-lang.org/std/future/trait.Future.html) by hand for example: implementing `poll()` requires a different mindset and approach. I still don't feel like I have a firm mental model of `Pin`. Sure, many libraries won't require this of you, but many foundational libraries (such as [`tower`](https://docs.rs/tower/latest/tower/)) can seem daunting if you're not comfortable with these concepts. It can feel limiting not having someone in your team or company who really groks this stuff.

### When not to use Rust

If you don’t want to think about error handling, or if you find type errors get in your way, then Rust probably isn’t for you. Rust will likely feel petty or pedantic.

If you just want to stand up a quick full stack CRUD app, Rust probably isn’t the best choice for your project. There are options available in the ecosystem, but other languages are likely to get you there much quicker, and have fewer rough edges.

If your team doesn’t know Rust, and isn’t interested in learning, then Rust surely isn’t the best choice. This might be the most important reason not to adopt Rust. Success really does rely on social cohesion and buy-in.

If your company is heavily invested in other languages, then I would be wary to introduce Rust unless there is a particularly compelling reason to do so. I'm not saying it can’t work, but maintaining multiple ecosystems can, well, multiply cost and effort.

> The right tool for the job is often the tool you are already using -- adding new tools has a higher cost than many people appreciate.
>
> -- [John Carmack](https://twitter.com/ID_AA_Carmack/status/989951283900514304?s=20)

## Conclusion

In short, Rust’s [values](https://www.slideshare.net/bcantrill/platform-values-rust-and-the-implications-for-system-software) match mine pretty well. If I were building a purely backend system in a team who were comfortable with Rust, it would be my first choice. [Zero To Production In Rust](https://www.zero2prod.com/) is a great example of how achievable and accessible it is.

*This post was largely inspired by [Why use Rust on the backend?](https://blog.adamchalmers.com/why-rust-on-backend/).*
