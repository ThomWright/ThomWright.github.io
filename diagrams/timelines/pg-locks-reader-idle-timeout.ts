import type { Timeline } from '../timeline.ts'
import { scenario } from './pg-locks-example.ts'

export default {
  ...scenario,
  timeout: { lane: 'reader', from: 4, to: 10.5, label: 'idle_in_transaction_session_timeout', labelRow: 8, side: 'right' },
} satisfies Timeline
