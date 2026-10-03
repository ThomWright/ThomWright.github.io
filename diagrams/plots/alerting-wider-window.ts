import type { Plot } from '../plot.ts'
import { lastQuarterHour } from './alerting-burst.ts'

export default {
  ...lastQuarterHour,
  x: {
    domain: [-60, 0],
    ticks: [
      { at: -60, label: '-1h' },
      { at: 0, label: 'now' },
    ],
  },
  areas: [
    { kind: 'window', from: -60, to: 0, height: 0.2 },
    { kind: 'errors', from: -3, to: -1, height: 1 },
  ],
  arrows: [{ from: [-5, 0.6], to: [-15, 0.6], colour: 'alert' }],
} satisfies Plot
