import assert from 'node:assert/strict'
import { test } from 'node:test'
import { needsDescription } from './description.ts'

const post = (frontMatter: string, body: string) => `---\n${frontMatter}---\n${body}`

test('accepts a post opening with a paragraph', () => {
  assert.equal(needsDescription(post('title: A\n', '\nSome *prose* here.\n\nMore.\n')), false)
  assert.equal(needsDescription(post('title: A\n', '\n[A link](/x) starts it.\n')), false)
})

test('accepts a comment directly followed by a paragraph', () => {
  assert.equal(needsDescription(post('title: A\n', '\n<!-- begin_excerpt -->\nProse.\n')), false)
})

test('flags a post opening with something other than a paragraph', () => {
  const openings = [
    '<!-- markdownlint-disable MD033 -->\n\nProse.\n',
    '> A quote.\n>\n> -- Someone\n\nProse.\n',
    '{% include callout.html content="Aside" %}\n\nProse.\n',
    '## Heading\n\nProse.\n',
    '```js\ncode()\n```\n',
    '![An image](/x.png)\n',
    '',
  ]
  for (const body of openings) {
    assert.equal(needsDescription(post('title: A\n', `\n${body}`)), true, body)
  }
})

test('accepts any opening when the post sets a description', () => {
  assert.equal(needsDescription(post('title: A\ndescription: "Set."\n', '\n> A quote.\n')), false)
})
