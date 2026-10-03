---
layout: post
title: Git rebase &#45;&#45;onto
description: "I generally prefer to keep my git history as a straight line. And my branches (when I have to use them) based on the HEAD of **main**. I pull **main** and rebase my branch onto it fairly often to keep up to date with the latest changes."
changes:
  - date: 2022-11-07
    summary: Added the newer `--update-refs` alternative.
last_modified_at: 2022-11-07
tags: [tools, tips, git]
---


<!-- markdownlint-disable MD033 -->

{% include callout.html
  type="info"
  content="EDIT (November 2022): There is now another (better?) way! Using the new `--update-refs` flag, as shown [here](https://adamj.eu/tech/2022/10/15/how-to-rebase-stacked-git-branches/)."
%}

<!-- begin_excerpt -->
I generally prefer to keep my git history as a straight line. And my branches (when I have to use them) based on the HEAD of **main**. I pull **main** and rebase my branch onto it fairly often to keep up to date with the latest changes.

Recently I’ve been in the unfortunate position where it made sense to use a branch off a branch. This can be a pain to keep up to date with the latest changes on **main**.
<!-- end_excerpt -->

{% include diagram.html
  name="git-branch-off-branch"
  caption="Branching off an existing branch"
  alt="A commit graph. B1 branches off main, and B2 branches off B1."
%}

Fortunately, a colleague introduced me to `git rebase --onto` which (while still a faff) made this process much easier.

The [git rebase documentation](https://git-scm.com/docs/git-rebase) specifies this form:

```bash
git rebase --onto <newbase> [<upstream> [<branch>]]
```

Though I like to think of it like this:

```bash
git rebase --onto <ONTO>
                  <FROM> # Exclusive
                  <TO>   # Inclusive
```

The example given in the git documentation shows how to rebase a **topic** branch onto **master**, where **topic** is currently based on **next**: `git rebase --onto master next topic`. Here you are rebasing onto **master**, from **next** up to **topic**.

*\<branch\>* (or *\<TO\>*) defaults to HEAD. In other words, if you’re already on the branch you want to work with, you can omit it. In the above example, if you have checked out **topic** then you can run: `git rebase --onto master next`.

What we want to do is slightly different. Let's have a look.

We start with our two branches, and a new commit on **main** which we’ve recently pulled.

{% include diagram.html
  name="git-rebase-start"
  caption="Our starting point"
  alt="A commit graph. main has a new commit. B1 branches off the commit before it, and B2 branches off B1."
%}

Then we rebase the first branch onto **main**. This leaves an old commit behind, which our second branch is still based on.

{% include diagram.html
  name="git-rebase-b1"
  caption="After rebasing **B1** onto **main**"
  alt="After git rebase main B1: B1 points to a New commit on top of main. B2 still branches off the Old commit, which branches off main's previous commit."
%}

We then want to rebase our second branch onto the first.

In many cases `git rebase B1 B2` will work, which makes this tempting. However, if there was a merge conflict when rebasing **B1** onto **main**, then the text diffs between the *Old* and *New* commits might differ. In which case, you’ll end up with some unwanted commits on your new **B2** branch. If you had a lot of commits on **B1**, this could get very messy!

{% include diagram.html
  name="git-rebase-onto"
  alt="After git rebase --onto B1 Old B2: B2 branches off New, the head of B1. This is always gonna work."
  name_2="git-rebase-b2"
  alt_2="After git rebase B1 B2: B2 branches off a copy of Old, which sits on top of New. The copy is omitted if Old and New have the same text diff. This won't end nicely if there was a merge conflict in the previous rebase."
  caption="Rebasing **B2** onto **B1**, with and without `--onto`"
%}

So there we have it. Mainly I’m just writing this as a reminder for myself if I have to do this again (let’s hope not).

This is just one use for `git rebase --onto`. See the links below for more information about what else you can do with it.

## Further reading

- [`git-rebase` docs](https://git-scm.com/docs/git-rebase)
- [Git rebase \-\-onto an overview](https://womanonrails.com/git-rebase-onto)
- [Stacked Diffs Versus Pull Requests](https://jg.gg/2018/09/29/stacked-diffs-versus-pull-requests/) for an alternative solution
  - [Graphite](https://graphite.dev/) as a tool for using stacked diffs on GitHub
- [How to rebase stacked Git branches](https://adamj.eu/tech/2022/10/15/how-to-rebase-stacked-git-branches/)
