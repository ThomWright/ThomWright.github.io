import type { Timeline } from '../timeline.ts'
import { scenario } from './pg-locks-example.ts'

export default {
  ...scenario,
  timeout: { lane: 'reader', from: 1, to: 4, label: 'statement_timeout', labelRow: 4.5, side: 'right' },
} satisfies Timeline
