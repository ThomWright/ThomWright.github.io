import type { Timeline } from '../timeline.ts'

/**
 * A reader idles in a transaction holding a lock, so a migration waits for
 * it, and the application's queries queue up behind the migration.
 */
export const scenario = {
  lanes: {
    reader: {
      title: 'Connection 1',
      subtitle: 'Reader',
      text: [
        { row: 0, text: 'BEGIN' },
        { row: 2, text: 'SELECT *' },
        { row: 3, text: '   WHERE id = 1' },
        { row: 6, text: 'sits around...', muted: true },
        { row: 11, text: 'COMMIT' },
      ],
      bars: [{ from: 1, to: 11.5, state: 'shared' }],
    },
    migrator: {
      title: 'Connection 2',
      subtitle: 'Migrator',
      text: [
        { row: 1, text: 'BEGIN' },
        { row: 3, text: 'ALTER TABLE', muted: true },
        { row: 4, text: '   ADD COLUMN', muted: true },
        { row: 6, text: 'waits...', muted: true },
        { row: 12.5, text: 'ALTER TABLE' },
        { row: 13.5, text: '   ADD COLUMN' },
        { row: 16, text: 'COMMIT' },
      ],
      bars: [
        { from: 2, to: 11.5, state: 'waiting' },
        { from: 11.5, to: 16.5, state: 'exclusive' },
      ],
    },
    app: {
      title: 'Connection 3/4/5/…',
      subtitle: 'Application',
      text: [
        { row: 5, text: 'BEGIN' },
        { row: 7, text: 'SELECT *', muted: true },
        { row: 8, text: '   WHERE id = 1', muted: true },
        { row: 10, text: 'waits...', muted: true },
        { row: 17.5, text: 'SELECT *' },
        { row: 18.5, text: '   WHERE id = 1' },
        { row: 20.5, text: 'COMMIT' },
      ],
      bars: [
        { from: 6, to: 16.5, state: 'waiting' },
        { from: 16.5, to: 21, state: 'shared' },
      ],
    },
  },
  releases: [
    { row: 11.5, from: 'reader', to: 'app' },
    { row: 16.5, from: 'migrator', to: 'app' },
  ],
} satisfies Timeline

export default {
  ...scenario,
  notes: [
    { at: { lane: 'app', row: 0 }, text: "Can't acquire lock," },
    { at: { lane: 'app', row: 1 }, text: 'waits in lock queue' },
  ],
  arrows: [
    { from: { lane: 'app', row: 0.5, col: -1 }, to: { lane: 'migrator', row: 3, col: 12 } },
    { from: { lane: 'app', row: 1.6, col: 7 }, to: { lane: 'app', row: 6.4, col: 7 } },
  ],
} satisfies Timeline
