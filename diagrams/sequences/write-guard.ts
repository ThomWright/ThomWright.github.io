import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', db: 'Database', other: 'Other system' },
  steps: [
    { section: 'Request', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'write guard', reply: 'new' },
      { from: 'app', to: 'other', label: 'write', reply: true },
    ]},
    { divider: true },
    { section: 'Retry', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'write guard', reply: 'exists' },
    ]},
  ],
} satisfies Sequence
