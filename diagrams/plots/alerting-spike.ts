import type { Plot } from '../plot.ts'

/** A 1 minute spike of 1% errors, over a 0.2% threshold over 5 minutes. */
export default {
  title: 'Error rate',
  x: {
    domain: [-5, 0],
    ticks: [
      { at: -5, label: '-5m' },
      { at: 0, label: 'now' },
    ],
  },
  y: {
    domain: [0, 1.1],
    ticks: [
      { at: 0.2, label: '0.2%' },
      { at: 1, label: '1%' },
    ],
  },
  areas: [
    { kind: 'window', from: -5, to: 0, height: 0.2 },
    { kind: 'errors', from: -1, to: 0, height: 1 },
  ],
  slo: { at: 0.1, label: 'SLO' },
} satisfies Plot
