import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', db: 'Database' },
  steps: [
    { section: 'Connect', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'connect\n(6 round trips\n+ hashing)', reply: 'ready' },
    ]},
    { note: 'fork backend', lane: 'db' },
    { section: 'Query', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'query', reply: 'rows' },
    ]},
  ],
} satisfies Sequence
