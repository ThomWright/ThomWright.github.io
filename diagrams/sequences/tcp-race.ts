import type { Sequence } from '../sequence.ts'

export default {
  lanes: { client: 'Client', server: 'Server' },
  steps: [
    {
      parallel: [
        [
          { from: 'client', to: 'server', label: 'data', duration: 2.5 },
          { from: 'server', to: 'client', label: 'RST', duration: 2, immediate: true },
        ],
        [
          { divider: 'idle timeout' },
          { from: 'server', to: 'client', label: 'FIN', duration: 2 },
        ],
      ],
    },
  ],
} satisfies Sequence
