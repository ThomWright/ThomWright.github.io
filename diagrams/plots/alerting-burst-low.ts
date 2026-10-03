import type { Plot } from '../plot.ts'
import { lastQuarterHour } from './alerting-burst.ts'

export default {
  ...lastQuarterHour,
  areas: [
    { kind: 'window', from: -5, to: 0, height: 0.2 },
    { kind: 'errors', from: -3, to: -1, height: 0.3 },
  ],
} satisfies Plot
