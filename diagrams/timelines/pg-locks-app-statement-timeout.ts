import type { Timeline } from '../timeline.ts'
import { scenario } from './pg-locks-example.ts'

export default {
  ...scenario,
  timeout: { lane: 'app', from: 6, to: 20, label: 'statement_timeout', labelRow: 13.5, side: 'right' },
} satisfies Timeline
