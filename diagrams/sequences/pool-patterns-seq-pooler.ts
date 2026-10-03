import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', pooler: 'Pooler', db: 'Database' },
  steps: [
    { section: 'Connect', lane: 'app', steps: [
      { from: 'app', to: 'pooler', label: 'connect\n(6 round trips\n+ hashing)', reply: 'ready' },
    ]},
    { section: 'Query', lane: 'app', steps: [
      { from: 'app', to: 'pooler', label: 'query', reply: 'rows', calls: [
        { from: 'pooler', to: 'db', label: 'query', reply: 'rows' },
      ]},
    ]},
  ],
} satisfies Sequence
