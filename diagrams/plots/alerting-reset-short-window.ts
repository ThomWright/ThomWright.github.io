import type { Plot } from '../plot.ts'
import { outage } from './alerting-reset-spike.ts'

export default {
  ...outage,
  x: {
    ...outage.x,
    ticks: [...outage.x.ticks, { at: -5, label: '-5m', anchor: 'end' }],
  },
  areas: [...outage.areas, { kind: 'short-window', from: -5, to: 0, height: 1.44 }],
} satisfies Plot
