---
layout: post
title: "Writing tips: style and structure"
toc: true
tags: [writing, communication]
---

<!-- begin_excerpt -->
Writing is hard. Reading can be hard. Poor writing is harder to read, and common mistakes can be distracting (for many).

Here are my top tips for avoiding many common stylistic and structural mistakes I see.
<!-- end_excerpt -->

## Automation

Use a spellchecker. And pay attention to it!

If writing Markdown, use something like [markdownlint](https://github.com/DavidAnson/markdownlint).

Computers are here to help you.

## Style

### Headings

Always use **top-level headings (H1) at the top level of the document**. Then use second-level headings (H2) inside these H1 sections. Don't use e.g. third-level headings (H3) outside of an H2 section. If you only have H1-H3 (common in some tools) and start with H3, when you decide you need another level down you'll need to change all of your existing headings. Save yourself the pain.

**Prefer "Sentence case"** for document titles and headings, as opposed to "Title Case". OK this one is just a preference, but at least choose one and stick with it.

### Spacing

**Avoid adding extra spacing around headings**. Also avoid adding newlines between paragraphs unless necessary. Whatever you’re using to display the document ~~probably~~ hopefully has already considered vertical rhythm in their design.

At the very least be *consistent* with your use of white space. If you have two empty lines before a heading, have two empty lines before *every* heading.

### Links

<!-- markdownlint-disable-next-line MD037 -->
**Prefer named links**. E.g. prefer "[Writing tips]({% post_url 2024-02-03-writing-tips %})" instead of "the writing tips are [here]({% post_url 2024-02-03-writing-tips %})" which lacks context.

Similarly, **avoid naked URLs**. E.g. prefer [GitHub](https://github.com) to <https://github.com>.

### Punctuation

End sentences in full stops.

- Even when using bullet points.
- If you choose not to end your list items with full stops, at least do so *consistently* within the same list.
- Yes, even when the sentence ends with `formatted code`.

### Lists

Use ordered lists when:

1. The order is meaningful. E.g. a list of goals in priority order, or a list of steps.
2. It is likely someone will want to refer to each point individually. E.g. when sending someone a list of questions.

The above list is ordered because so I can refer to point 2 above as the reason.

Otherwise, use unordered lists.

### Continuity

**Text inside parentheses should be removable**. When using parentheses (like this), make sure the sentence makes sense with the parentheses (and their contents) removed. Don't do it like this (remove this bit and you'll see) that it doesn't make sense.

**Keep tense consistent** throughout consecutive bullet points. E.g. each of the points in this list should be in the [imperative mood](https://en.wikipedia.org/wiki/Imperative_mood):

- ✅ Do it like this.
- ✅ Avoid changing tense.
- ❌ Not doing it like this.
- ❌ Changing tense.

Related: if the first item in a bulleted list continues the preceding phrase, then *all* points should continue that phrase. For example, this list:

- continues the previous phase, it finishes the above sentence. ✅
- this does not. "This list this does not" does not make sense. ❌
- has another run-on sentence. ✅

### Emphasis

Use **bold** to draw the eye and **highlight important points**. Use *italics* for emphasis. Avoid using both together. (I mean, **it *can* be fine** in context but generally it's a bit much. As is using three exclamation marks!!!)

### Capitalisation

Capitalise proper nouns, including company names, e.g. Stripe, Amazon.

Capitalise API, ID and URL. Don't capitalise the s when pluralising, they should be APIs, IDs, and URLs.

### Abbreviations

Use abbreviations correctly:

- "Etc." always ends in a full stop. It is an abbreviation of "etcetera".
- "E.g." means "for example".
- "I.e." means "that is".
- "Aka" is short for "also known as".

**Prefer full words over colloquial abbreviations**. E.g. prefer configuration over "config" and database over "db".

### Grammar

**"You and I" vs "you and me"** – remove the other person from the sentence and see which makes sense. For example:

- I do software engineering.
  - ✅ You and I do software engineering.
  - ❌ Me do software engineering.
  - ❌ You and me do software engineering.
- Writing correct English is important to me.
  - ✅ Writing correct English is important to me and you.
  - ❌ Writing correct English is important to I.
  - ❌ Writing correct English is important to you and I.

**"Setup" is a noun, "set up" is a [phrasal verb](https://en.wikipedia.org/wiki/English_phrasal_verbs)**. You set up a setup. Generally: join compound words together when they're a noun, separate them when they're a verb. Examples:

- Let’s **set up** this **setup** together.
- I went to **check out** at the **checkout**.
- I tried to **log in** but the **login** page was broken. The same thing happened when I tried to **log out** using the **logout** button.

    Note: most action buttons are verbs, e.g. on a mailing list you would click *Subscribe* not *Subscription*. So here the buttons should say **Log in** and **Log out**.
- It **may be** that **maybe** I don't know how to articulate this particular rule, but if it makes sense to separate "maybe" then it's probably correct to do so.
- **Anyway**, is there **any way** we can try to avoid joining words together when hey should be separate?
- I would like to **feed back** that the **feedback** you gave me was utterly pedantic.
- We should **break down** these massive Jira tickets before I have a **breakdown**.
- When you’re not sure which form to use, **fall back** to using two words unless you can prefix it with "a" or "the". That’s a **fallback** option you can rely on.
- **Every day** we do **everyday** things.
- The application **shut down** after the **shutdown** signal was fired.

## Structure

Design documents to be **read top-to-bottom**, with minimal jumping around. Try to not refer to any information *lower* down the page. Forward references make reading a document top-to-bottom more difficult.

**Structure for lazy people**. Try to maximise opportunities for the reader to *stop reading*. Some tips:

- Tell the reader what they're going to read so they know whether it's worth their time.
- Include a table of contents if the document is long.
- Include the most important information at the top. Perhaps a summary.
- Give a complete set of information early on, and supplementary information later.

For example, you could structure ADRs or design proposals such that the reader can (in order):

1. read the decision/outcome – probably the most important thing
2. understand the context and goals
3. optionally read the reasons for the decision (e.g. pros/cons, comparison between options)
4. optionally read the in-depth design
5. optionally read the alternative designs
6. optionally read the appendices with reference information

## Templates

Some document structures I tend to reach for.

### ADR (Architecture Decision Record)

A document describing a technical or architectural decision that was made, along with the justification for the decision over other possible options.

- **Summary**

  *Optional. Helpful to summarise the decision, especially if it's a long document.*

- **Context**

  *Background information needed to understand this ADR. Likely to include the current state and problem(s) to be solved.*

- **Goals**

  *In priority order. Consider SMART goals. Also include non-goals if helpful.*

- **Decision**

  *Which option was decided and why?*

- **Design options**

  *What options were considered? What are the pros and cons?*

  - **Comparison**

    *High level comparison. Consider using a table with each option as a column, and each relevant metric as a row. Score each option against each metric.*

  - **[Option 1]**
  - **[Option 2]**
  - etc.
- **Appendices**

  *Supplementary information, stuff that's useful but not required. E.g. links to relevant blog posts.*

### Technical brief

A technical design for a project. Likely to follow a product brief, clearly justifying the reason for investing in the project.

1. Context
   1. Problem summary
   2. Document purpose and scope
   3. Goals
   4. Technical requirements
   5. Scale requirements
2. Solution
   1. High-level architecture
   2. System components
   3. End-to-end flows
   4. Internal and external dependencies
   5. [Optional] Extra sections for more in depth design
3. Project
   1. Milestones
4. Appendix
   1. Related resources
   2. Glossary

## Further reading

- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)
  - [More on design docs](https://www.industrialempathy.com/posts/design-doc-a-design-doc/)
- [Squarespace RFC template](https://static1.squarespace.com/static/56ab961ecbced617ccd2461e/t/5d792e5a4dac4074658ce64b/1568222810968/Squarespace+RFC+Template.pdf)
