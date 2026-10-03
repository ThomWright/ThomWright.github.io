import type { Plot } from '../plot.ts'

/**
 * A 2 minute burst of 1% errors, against a 0.2% threshold over 5 minutes.
 * The error rate is in percent and time in minutes.
 */
export const lastQuarterHour = {
  title: 'Error rate',
  x: {
    domain: [-15, 0],
    ticks: [
      { at: -15, label: '-15m' },
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
} satisfies Plot

export default {
  ...lastQuarterHour,
  areas: [
    { kind: 'window', from: -5, to: 0, height: 0.2 },
    { kind: 'errors', from: -3, to: -1, height: 1 },
  ],
  arrows: [{ from: [-3.5, 0.6], to: [-6.5, 0.6], colour: 'alert' }],
} satisfies Plot
