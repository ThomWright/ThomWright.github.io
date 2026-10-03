import assert from 'node:assert/strict'
import { test } from 'node:test'
import { syncLastModified } from './last-modified.ts'

const post = (frontMatter: string) => `---\n${frontMatter}---\n\nBody with changes:\n  - date: 2099-01-01\n`

test('adds last_modified_at after the changes list', () => {
  const source = post(
    'title: A\nchanges:\n  - date: 2024-01-02\n    summary: First.\ntags: [a]\n',
  )
  assert.equal(
    syncLastModified(source),
    post(
      'title: A\nchanges:\n  - date: 2024-01-02\n    summary: First.\nlast_modified_at: 2024-01-02\ntags: [a]\n',
    ),
  )
})

test('uses the latest date, whatever the order of the changes', () => {
  const source = post(
    'changes:\n  - date: 2024-03-01\n    summary: B.\n  - date: 2025-01-01\n    summary: C.\n  - date: 2024-01-01\n    summary: A.\n',
  )
  assert.match(syncLastModified(source), /^last_modified_at: 2025-01-01$/m)
})

test('updates a stale last_modified_at in place', () => {
  const source = post(
    'title: A\nlast_modified_at: 2024-01-01\nchanges:\n  - date: 2024-05-06\n    summary: B.\n',
  )
  assert.equal(
    syncLastModified(source),
    post('title: A\nlast_modified_at: 2024-05-06\nchanges:\n  - date: 2024-05-06\n    summary: B.\n'),
  )
})

test('leaves an up-to-date file unchanged', () => {
  const source = post('changes:\n  - date: 2024-01-02\n    summary: A.\nlast_modified_at: 2024-01-02\n')
  assert.equal(syncLastModified(source), source)
})

test('leaves a file without changes unchanged', () => {
  const source = post('title: A\nlast_modified_at: 2024-01-02\n')
  assert.equal(syncLastModified(source), source)
  assert.equal(syncLastModified('No front matter\n'), 'No front matter\n')
})
