---
layout: post
title: Git rebase --onto
---

<!-- markdownlint-disable MD033 -->

*EDIT (November 2022): There is now another (better?) way! Using the new `--update-refs` flag, as shown [here](https://adamj.eu/tech/2022/10/15/how-to-rebase-stacked-git-branches/).*

I generally prefer to keep my git history as a straight line. And my branches (when I have to use them) based on the HEAD of **main**. I pull **main** and rebase my branch onto it fairly often to keep up to date with the latest changes.

Recently I’ve been in the unfortunate position where it made sense to use a branch off a branch. This can be a pain to keep up to date with the latest changes on **main**.

{% include figure.html
  img_src="/public/assets/branch-off-branch.excalidraw.png"
  caption="Branching off an existing branch"
  alt="A branch off a branch"
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

We start with our two branches, and a new commit on **main** which we’ve recently pulled, and then rebase the first branch onto **main**. This leaves an old commit behind, which our second branch is still based on. We then want to rebase our second branch onto the first.

In many cases `git rebase B1 B2` will work, which makes this tempting. However, if there was a merge conflict when rebasing **B1** onto **main**, then the text diffs between the *Old* and *New* commits might differ. In which case, you’ll end up with some unwanted commits on your new **B2** branch. If you had a lot of commits on **B1**, this could get very messy!

{% include figure.html
  img_src="/public/assets/git-rebase-onto.excalidraw.png"
  caption="Using `git rebase --onto`"
  alt="git rebase --onto"
%}

(You might want to open the image in a new tab to see it full size.)

So there we have it. Mainly I’m just writing this as a reminder for myself if I have to do this again (let’s hope not).

This is just one use for `git rebase --onto`. See the links below for more information about what else you can do with it.

## Further reading

- [`git-rebase` docs](https://git-scm.com/docs/git-rebase)
- [Git rebase --onto an overview](https://womanonrails.com/git-rebase-onto)
- [Stacked Diffs Versus Pull Requests](https://jg.gg/2018/09/29/stacked-diffs-versus-pull-requests/) for an alternative solution
  - [Graphite](https://graphite.dev/) as a tool for using stacked diffs on GitHub
- [How to rebase stacked Git branches](https://adamj.eu/tech/2022/10/15/how-to-rebase-stacked-git-branches/)
