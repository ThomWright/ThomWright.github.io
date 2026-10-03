/**
 * Timelines of database connections in the house style (see
 * public/css/_sass/_diagrams.scss): what each connection runs, and when it
 * holds or waits for a lock.
 *
 * Each lane is a connection, and everything on it is placed by row, from
 * the top. Rows can be fractional, e.g. to put a bar's end between two lines
 * of text. Leading spaces indent a line of text.
 */

export type Timeline = {
  /** Lane IDs mapped to their lanes, left to right. */
  lanes: Record<string, Lane>
  /** Points where one lane releases a lock that another is waiting for. */
  releases?: Release[]
  notes?: Note[]
  arrows?: Arrow[]
  /** Fades every other lane, and brackets the time a timeout measures. */
  timeout?: Timeout
}

export type Lane = {
  title: string
  subtitle: string
  text: Text[]
  bars: Bar[]
}

/** A statement, highlighted unless `muted`, e.g. while it waits. */
export type Text = { row: number; text: string; muted?: boolean }

/** A lock held or waited for, from one row to another. */
export type Bar = { from: number; to: number; state: 'shared' | 'exclusive' | 'waiting' }

/** A dashed line from the releasing lane to the lane it unblocks. */
export type Release = { row: number; from: string; to: string }

/** A muted annotation, starting at `at`. */
export type Note = { at: Position; text: string }

export type Arrow = { from: Position; to: Position }

/** A point on a lane. `col` counts characters from where its text starts. */
export type Position = { lane: string; row: number; col?: number }

export type Timeout = {
  lane: string
  from: number
  to: number
  label: string
  /** The label's row, as the middle of the bracket may already have text. */
  labelRow: number
  side: 'left' | 'right'
}

// Inconsolata's advance width is half an em.
const TEXT_SIZE = 15
const HEADING_SIZE = 17
const CHAR_WIDTH = TEXT_SIZE / 2
// Puts the visual centre of a line of text on its y coordinate.
const BASELINE_SHIFT = 5
// Where that visual centre really is, relative to the y coordinate, when
// fitting a background behind the text.
const TEXT_CENTRE = 1
const LABEL_PADDING = 4

const MARGIN = 20
const LANE_GAP = 200
const TITLE_Y = 30
const SUBTITLE_Y = 52
const FIRST_ROW = 90
const ROW = 20
const TEXT_INDENT = 20
const BRACKET_HALF_WIDTH = 16

const STATE_CLASS: Record<Bar['state'], string> = {
  shared: 'd-success',
  exclusive: 'd-warning',
  waiting: 'd-alert',
}

// Feed readers drop the site's CSS, so faded lanes carry their opacity too.
const FADED = 'opacity="0.35"'

/** Renders a timeline as an inline SVG, prefixing its IDs with `name`. */
export function render(name: string, timeline: Timeline): string {
  const laneX: Record<string, number> = {}
  Object.keys(timeline.lanes).forEach((id, i) => {
    laneX[id] = MARGIN + i * LANE_GAP
  })
  const lane = (id: string): number => {
    const x = laneX[id]
    if (x === undefined) throw new Error(`Unknown lane: ${id}`)
    return x
  }
  const point = (p: Position): { x: number; y: number } => ({
    x: lane(p.lane) + TEXT_INDENT + (p.col ?? 0) * CHAR_WIDTH,
    y: rowY(p.row),
  })

  let right = 0
  let bottom = 0
  const text = (x: number, row: number, content: string, cls = ''): string => {
    const indent = content.length - content.trimStart().length
    const left = x + indent * CHAR_WIDTH
    right = Math.max(right, left + content.trim().length * CHAR_WIDTH)
    bottom = Math.max(bottom, rowY(row))
    const classAttr = cls ? `class="${cls}" ` : ''
    return `<text ${classAttr}x="${n(left)}" y="${n(rowY(row) + BASELINE_SHIFT)}" fill="currentColor">${escape(content.trim())}</text>`
  }

  const focus = timeline.timeout?.lane
  if (focus !== undefined) lane(focus)
  const faded = (id: string): boolean => focus !== undefined && id !== focus
  const fade = (lines: string[]): string[] => [
    `  <g class="d-faded" ${FADED}>`,
    ...lines.map((l) => `  ${l}`),
    '  </g>',
  ]

  const headers = Object.entries(timeline.lanes).flatMap(([id, l]) => {
    right = Math.max(right, lane(id) + l.title.length * (HEADING_SIZE / 2))
    return [
      `  <text class="d-heading" x="${lane(id)}" y="${TITLE_Y}" fill="currentColor">${escape(l.title)}</text>`,
      `  <text class="d-muted" x="${lane(id)}" y="${SUBTITLE_Y}" fill="currentColor">${escape(l.subtitle)}</text>`,
    ]
  })

  const releases = (timeline.releases ?? []).map(
    (r) =>
      `  <path class="d-line d-thin d-dashed d-muted" d="M${lane(r.from)},${n(rowY(r.row))} H${lane(r.to)}" fill="none" stroke="currentColor" ${dashed}/>`,
  )

  const lanes = Object.entries(timeline.lanes).flatMap(([id, l]) => {
    const x = lane(id)
    const bars = l.bars.map((b) => {
      bottom = Math.max(bottom, rowY(b.to))
      return `  <path class="d-line d-thick ${STATE_CLASS[b.state]}" d="M${x},${n(rowY(b.from))} V${n(rowY(b.to))}" fill="none" stroke="currentColor" stroke-width="4"/>`
    })
    const texts = l.text.map(
      (t) => `  ${text(x + TEXT_INDENT, t.row, t.text, t.muted ? 'd-muted' : 'd-accent')}`,
    )
    const lines = [`  <!-- ${l.title} -->`, ...bars, ...texts]
    return [...(faded(id) ? fade(lines) : lines), '']
  })

  const notes = (timeline.notes ?? []).map(
    (note) => `  ${text(point(note.at).x, note.at.row, note.text, 'd-muted')}`,
  )
  const arrows = (timeline.arrows ?? []).map((a) => {
    const from = point(a.from)
    const to = point(a.to)
    return `  <path class="d-line d-thin d-muted" d="M${n(from.x)},${n(from.y)} L${n(to.x)},${n(to.y)}" fill="none" stroke="currentColor" marker-end="url(#${name}-arrow)"/>`
  })

  let timeout: string[] = []
  if (timeline.timeout) {
    const t = timeline.timeout
    const x = lane(t.lane)
    const width = t.label.length * CHAR_WIDTH
    const left = t.side === 'right' ? x + TEXT_INDENT : x - TEXT_INDENT - width
    right = Math.max(right, left + width)
    timeout = bracket(t, x, left, width)
  }

  const width = Math.ceil(right + MARGIN)
  const height = Math.ceil(bottom + MARGIN)

  return [
    `<svg class="diagram" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ...(arrows.length
      ? [
          '  <defs>',
          `    <marker id="${name}-arrow" class="d-muted" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">`,
          '      <path class="d-arrowhead" d="M0,0 L10,5 L0,10 z" fill="currentColor"/>',
          '    </marker>',
          '  </defs>',
          '',
        ]
      : []),
    ...headers,
    '',
    ...(focus !== undefined ? fade(releases) : releases),
    '',
    ...lanes,
    ...notes,
    ...arrows,
    ...timeout,
    '</svg>',
    '',
  ].join('\n')
}

/**
 * A thick line with a tick at each end, over the lane's own bars, and its
 * label on a background so it can sit over other lanes.
 */
function bracket(t: Timeout, x: number, labelLeft: number, labelWidth: number): string[] {
  const top = n(rowY(t.from))
  const bottom = n(rowY(t.to))
  const h = BRACKET_HALF_WIDTH
  const y = rowY(t.labelRow)
  return [
    '  <!-- Timeout -->',
    `  <path class="d-line d-thick" d="M${x},${top} V${bottom} M${x - h},${top} H${x + h} M${x - h},${bottom} H${x + h}" fill="none" stroke="currentColor" stroke-width="4"/>`,
    `  <rect class="d-knockout" x="${n(labelLeft - LABEL_PADDING)}" y="${n(y + TEXT_CENTRE - ROW / 2)}" width="${n(labelWidth + LABEL_PADDING * 2)}" height="${ROW}" fill="none"/>`,
    `  <text class="d-bold" x="${n(labelLeft)}" y="${n(y + BASELINE_SHIFT)}" fill="currentColor">${escape(t.label)}</text>`,
  ]
}

function rowY(row: number): number {
  return FIRST_ROW + row * ROW
}

// Feed readers drop the site's CSS, so lines carry their dash pattern too.
const dashed = 'stroke-dasharray="7 6"'

/** Formats a coordinate without floating-point noise. */
function n(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
