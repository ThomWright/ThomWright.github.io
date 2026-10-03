import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', pooler: 'Pooler', db: 'Database' },
  steps: [
    { section: 'Query', lane: 'app', steps: [
      { from: 'app', to: 'pooler', label: 'query', reply: 'rows', calls: [
        { from: 'pooler', to: 'db', label: 'query', reply: 'rows' },
      ]},
    ]},
  ],
} satisfies Sequence
