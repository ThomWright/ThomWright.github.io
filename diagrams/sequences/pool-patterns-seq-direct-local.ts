import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', db: 'Database' },
  steps: [
    { section: 'Query', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'query', reply: 'rows' },
    ]},
  ],
} satisfies Sequence
