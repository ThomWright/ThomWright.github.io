import type { Plot } from '../plot.ts'

/**
 * An outage that has ended, but is still inside a 1 hour window with a
 * 1.44% threshold. The outage's error rate isn't to scale.
 */
export const outage = {
  title: 'Error rate',
  x: {
    domain: [-60, 0],
    ticks: [
      { at: -60, label: '-1h' },
      { at: 0, label: 'now' },
    ],
  },
  y: { domain: [0, 12], ticks: [{ at: 1.44, label: '1.44%' }] },
  areas: [
    { kind: 'window', from: -60, to: 0, height: 1.44 },
    { kind: 'errors', from: -45, to: -35, height: 11 },
  ],
  arrows: [{ from: [-47, 5.5], to: [-57, 5.5], colour: 'alert' }],
} satisfies Plot

export default outage
