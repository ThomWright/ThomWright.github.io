import type { Timeline } from '../timeline.ts'
import { scenario } from './pg-locks-example.ts'

export default {
  ...scenario,
  timeout: { lane: 'app', from: 6, to: 16.5, label: 'lock_timeout', labelRow: 13.5, side: 'right' },
} satisfies Timeline
