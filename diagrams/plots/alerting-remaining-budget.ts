import type { Plot } from '../plot.ts'

/** The error budget left over 30 days, at four burn rates. */
export default {
  title: 'Remaining error budget',
  x: {
    domain: [-30, 0],
    ticks: [
      { at: -30, label: '-30d' },
      { at: 0, label: 'now' },
    ],
  },
  y: {
    domain: [-200, 100],
    ticks: [
      { at: 100, label: '100%' },
      { at: 0, label: '0%' },
    ],
  },
  slo: { at: 0 },
  lines: [
    { from: [-30, 100], to: [0, 50], label: '0.5', colour: 'success' },
    { from: [-30, 100], to: [0, 0], label: '1', colour: 'ink' },
    { from: [-30, 100], to: [0, -100], label: '2', colour: 'warning' },
    { from: [-30, 100], to: [0, -200], label: '3', colour: 'alert' },
  ],
} satisfies Plot
