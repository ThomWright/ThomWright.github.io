import type { Plot } from '../plot.ts'

/**
 * The three alerts' long windows and thresholds. Time is in minutes, and
 * not to scale, so the shorter windows are wide enough to see.
 */
export default {
  title: 'Error rate',
  x: {
    scale: [
      [-4320, 0],
      [-360, 0.75],
      [-60, 0.92],
      [0, 1],
    ],
    ticks: [
      { at: -4320, label: '-3d' },
      { at: -360, label: '-6h' },
      { at: -60, label: '-1h' },
    ],
  },
  y: {
    domain: [0, 1.6],
    ticks: [
      { at: 0.1, label: '0.1%' },
      { at: 0.6, label: '0.6%' },
      { at: 1.44, label: '1.44%' },
    ],
  },
  areas: [
    { kind: 'window', from: -4320, to: 0, height: 0.1 },
    { kind: 'window', from: -360, to: 0, height: 0.6 },
    { kind: 'window', from: -60, to: 0, height: 1.44 },
  ],
} satisfies Plot
