import type { Sequence } from '../sequence.ts'

export default {
  lanes: { client: 'Client', server: 'Server' },
  steps: [
    {
      section: 'New request',
      lane: 'client',
      steps: [
        { from: 'client', to: 'server', label: 'SYN', reply: 'SYN ACK' },
        { from: 'client', to: 'server', label: 'ACK' },
      ],
    },
    { note: 'Connection enters\nAccept queue', lane: 'server' },
  ],
} satisfies Sequence
