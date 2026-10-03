import type { Plot } from '../plot.ts'

/** A steady 0.15% error rate, under a 0.2% threshold over 5 minutes. */
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
    domain: [0, 0.35],
    ticks: [
      { at: 0.1, label: '0.1%' },
      { at: 0.2, label: '0.2%' },
      { at: 0.3, label: '0.3%' },
    ],
  },
  areas: [
    { kind: 'window', from: -5, to: 0, height: 0.2 },
    { kind: 'errors', from: -5, to: 0, height: 0.15 },
  ],
  slo: { at: 0.1, label: 'SLO' },
} satisfies Plot
