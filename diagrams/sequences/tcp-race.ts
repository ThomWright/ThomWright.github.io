import type { Sequence } from '../sequence.ts'

export default {
  lanes: { client: 'Client', server: 'Server' },
  steps: [
    {
      parallel: [
        [{ from: 'client', to: 'server', label: 'data', duration: 4 }],
        [{ divider: 'idle timeout' }, { from: 'server', to: 'client', label: 'FIN' }],
      ],
    },
    { from: 'server', to: 'client', label: 'RST' },
  ],
} satisfies Sequence
