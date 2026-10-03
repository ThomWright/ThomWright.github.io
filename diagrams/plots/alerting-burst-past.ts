import type { Plot } from '../plot.ts'
import { lastQuarterHour } from './alerting-burst.ts'

export default {
  ...lastQuarterHour,
  areas: [
    { kind: 'window', from: -5, to: 0, height: 0.2 },
    { kind: 'errors', from: -10, to: -8, height: 1 },
  ],
  arrows: [{ from: [-10.5, 0.6], to: [-13.5, 0.6], colour: 'alert' }],
} satisfies Plot
