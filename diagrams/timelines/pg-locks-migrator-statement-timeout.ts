import type { Timeline } from '../timeline.ts'
import { scenario } from './pg-locks-example.ts'

export default {
  ...scenario,
  timeout: { lane: 'migrator', from: 2, to: 15.5, label: 'statement_timeout', labelRow: 14.5, side: 'left' },
} satisfies Timeline
