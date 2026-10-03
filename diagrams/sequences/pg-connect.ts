import type { Sequence } from '../sequence.ts'

export default {
  lanes: { app: 'Application', db: 'Database' },
  steps: [
    { section: 'Connect', lane: 'app', steps: [
      { section: 'TCP', lane: 'app', steps: [
        { from: 'app', to: 'db', label: 'SYN', reply: 'SYN ACK' },
        { from: 'app', to: 'db', label: 'ACK', immediate: true },
      ]},
      { note: 'fork backend', lane: 'db' },
      { section: 'TLS', lane: 'app', steps: [
        { from: 'app', to: 'db', label: 'SSLRequest', reply: 'S', concurrent: true },
        { from: 'app', to: 'db', label: 'ClientHello', reply: 'ServerHello' },
        { from: 'app', to: 'db', label: 'Finished', immediate: true },
      ]},
      { section: 'SCRAM', lane: 'app', steps: [
        { from: 'app', to: 'db', label: 'startup', reply: 'SASL', concurrent: true },
        { from: 'app', to: 'db', label: 'client-first', reply: 'server-first' },
        { note: 'hash password\n4096 times', lane: 'app', left: true },
        { from: 'app', to: 'db', label: 'client-final', reply: 'ready' },
      ]},
    ]},
    { divider: true },
    { section: 'Query', lane: 'app', steps: [
      { from: 'app', to: 'db', label: 'query', reply: 'rows' },
    ]},
  ],
} satisfies Sequence
