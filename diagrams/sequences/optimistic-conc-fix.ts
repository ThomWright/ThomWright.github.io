import type { Sequence } from '../sequence.ts'

export default {
  lanes: { r1: 'Request 1', db: 'Database', r2: 'Request 2' },
  steps: [
    { parallel: [
      [{ from: 'r1', to: 'db', label: 'W x: 2\nif x: 1', reply: 'x: 2' }],
      [{ from: 'r2', to: 'db', label: 'W x: 2\nif x: 1', reply: 'error' }],
    ]},
  ],
} satisfies Sequence
