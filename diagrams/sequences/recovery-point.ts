import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', db: 'Database', other: 'Other system' },
  steps: [
    { section: 'Request', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'read\ncheckpoint\nID_x', reply: 'null' },
      { from: 'app', to: 'other', label: 'write', reply: true },
      { from: 'app', to: 'db', label: 'write\ncheckpoint\nID_x = 1', reply: true },
      { fail: 'crash or client timeout' },
    ]},
    { divider: true },
    { section: 'Retry', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'read\ncheckpoint\nID_x', reply: '1' },
    ]},
  ],
} satisfies Sequence
