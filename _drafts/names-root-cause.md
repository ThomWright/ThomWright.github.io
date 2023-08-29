---
layout: post
title: "Names matter: Root cause"
---

"Root cause" is a misleading term for the concept it represents. At least for computer scientists who consider a "root" to be singular. For other people who know what real trees actually look like, it's a perfectly good term.

If you are doing a Root Cause Analysis (RCA) for an incident, you might want to draw a tree structure of the causal factors.

At the root (the "root"), will be the incident itself. If you apply a technique like 5 Whys, you should identify one or more contributing causes. Generally these will be symptoms of more fundamental factors, so you might ask "why?" a few more times, branching off as necessary if there are multiple causes for any symptom.

For each branch, you should soon reach some cause which is either so fundamental that it makes little sense to continue asking why, or where eliminating that factor will be an effective enough remedy to prevent future occurrences of the incident or reduce their severity or frequency to acceptable levels.

Importantly, *there can be multiple root causes*. The root causes are the *leaf nodes* of a tree structure.

As computer scientists, we're taught to think of trees as having a single root, and I have seen this lead people to believe that they should be looking for a single root cause for an incident.

{% include callout.html
  type="aside"
  content="Could we not have called this concept a \"trunk node\" instead of a \"root node\"? Trees generally have a single trunk."
%}

Of course, real trees have a root structure which mimics their branch structure. That is,
there are multiple roots.

When doing Root Cause Analysis, think about real trees instead of the data structures.

{% include figure.html
  img_src="/public/assets/names-root/tree.jpeg"
  alt="A real tree"
  caption="A very nice tree"
  size="large"
%}
