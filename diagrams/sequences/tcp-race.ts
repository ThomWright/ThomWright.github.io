import type { Sequence } from '../sequence.ts'

export default {
  lanes: { client: 'Client', server: 'Server' },
  steps: [
    {
      parallel: [
        [{ from: 'client', to: 'server', label: 'data', duration: 2.5, reply: 'RST' }],
        [{ divider: 'idle timeout' }, { from: 'server', to: 'client', label: 'FIN' }],
      ],
    },
  ],
} satisfies Sequence
