import type { Plot } from '../plot.ts'

/** How changing an alert's threshold and window changes how it behaves. */
export default {
  title: 'Error threshold',
  xTitle: 'Alert window',
  x: { domain: [0, 10] },
  y: { domain: [0, 10] },
  areas: [{ kind: 'window', from: 5, to: 10, height: 6 }],
  slo: { at: 3.5, label: 'SLO' },
  arrows: [
    { from: [4.5, 4.5], to: [1, 4.5] },
    { from: [7.5, 6], to: [7.5, 3.5] },
  ],
  notes: [
    { at: [2.75, 6.5], text: ['Higher', 'precision'] },
    { at: [7.5, 8], text: ['Higher', 'sensitivity'] },
  ],
} satisfies Plot
