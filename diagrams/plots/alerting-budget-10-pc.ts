import type { Plot } from '../plot.ts'

/**
 * Three alerts that each fire once 10% of the error budget is used. Time is
 * in hours.
 */
export default {
  title: 'Error rate',
  x: {
    domain: [-72, 0],
    ticks: [
      { at: -72, label: '-3d' },
      { at: -21, label: '-21h' },
      { at: -7, label: '-7h' },
    ],
  },
  y: {
    domain: [0, 1.1],
    ticks: [
      { at: 0.1, label: '0.1%' },
      { at: 0.31, label: '0.31%' },
      { at: 1, label: '1%' },
    ],
  },
  areas: [
    { kind: 'window', from: -72, to: 0, height: 0.1 },
    { kind: 'window', from: -21, to: 0, height: 0.31 },
    { kind: 'window', from: -7, to: 0, height: 1 },
  ],
} satisfies Plot
