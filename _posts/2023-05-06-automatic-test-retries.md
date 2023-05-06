---
layout: post
title: Automatic test retries
tags: [testing, reliability, antipatterns]
---

One day, some sleazy individual might come up to you and whisper in your ear:

> Psst, I got something real nice for you. Check out this new test runner. It'll retry your tests for you if they fail, and if they pass after a few attempts it'll just say they succeeded and no one will have to know. No more flaky tests.

Don't buy it. This person is trying to sell you ~~drugs~~ lies and deception.

You might try it, just to give it a go. You might even like it. The tests are so much greener. No more manual re-running in CI. No more time spent fighting flaky tests. You don't have to pretend to yourself that "maybe I'll fix it next time it breaks..." because you don't even see the test failures. No more guilt. Feels good!

But you're lying to yourself. Underneath, you know the truth: **your tests are failing, and you're still shipping to prod**.

For now though, you can't get enough of it. You add it to all your projects, whether they need it or not. You start telling your friends and colleagues about it and get them hooked too.

Time passes, everyone is happy. Then a few projects start failing occasionally. No matter, you say, we'll just retry a couple more times. All is good again. For a while. Then more flaky tests start appearing. This isn't what you were promised. You're back where you started, craving the blissful feeling of endless green in CI.

You decide enough is enough, you're done with retries. Back to an honest, respectable test runner.

But now you're addicted. Before, you used to have one or two flaky tests which failed every now and then. Now you have dozens of them, and your test suite fails consistently. No one could see the cracks and decay accumulating behind the veneer of the automated retries. You couldn't face the thought of debugging and fixing one or two tests, but dozens? That's too many, you don't have time for that. You have Jira tickets with your name on, PMs asking for more features to deliver yesterday, deadlines approaching. Nothing can save you now.

Except maybe just a few more test retries...

Don't do it. Not even once.
