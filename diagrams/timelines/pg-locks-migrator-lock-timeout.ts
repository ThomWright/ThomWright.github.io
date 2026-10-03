import type { Timeline } from '../timeline.ts'
import { scenario } from './pg-locks-example.ts'

export default {
  ...scenario,
  timeout: { lane: 'migrator', from: 2, to: 11.5, label: 'lock_timeout', labelRow: 8, side: 'left' },
} satisfies Timeline
