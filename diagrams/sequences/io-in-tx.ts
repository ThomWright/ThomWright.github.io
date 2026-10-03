import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', db: 'Database', other: 'Other system' },
  steps: [
    { from: 'app', to: 'db', label: 'BEGIN', reply: true },
    { from: 'app', to: 'db', label: 'W', reply: true },
    { from: 'app', to: 'other', label: 'W', reply: true },
    { from: 'app', to: 'db', label: 'COMMIT', fail: 'crash or timeout' },
  ],
} satisfies Sequence
