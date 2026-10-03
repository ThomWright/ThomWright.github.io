/**
 * Sequence diagrams in the house style (see public/css/_sass/_diagrams.scss).
 *
 * A diagram is a list of steps, laid out top to bottom. Every call's arrow
 * slopes downwards to show time passing. Labels can span several lines,
 * separated by `\n`.
 */

export type Sequence = {
  /** Lane IDs mapped to their titles, left to right. */
  lanes: Record<string, string>
  steps: Step[]
}

export type Step = Call | LaneFailure | LaneNote | Divider | Section | Parallel

/**
 * A message from one lane to another, with an optional reply.
 *
 * `reply: true` draws an unlabelled reply. `fail` draws the call stopping
 * at a cross partway across, labelled with the given text, and no reply.
 * `duration` is how long the call takes to arrive, as a multiple of the
 * usual, e.g. so it crosses messages in a parallel branch. `immediate`
 * starts it the moment the previous step ends, e.g. a response sent as soon
 * as something arrives. `concurrent` starts it shortly after the previous
 * call is sent, without waiting for that call to arrive, so both are in
 * flight at once.
 */
export type Call = {
  from: string
  to: string
  label?: string
  reply?: string | true
  fail?: string
  duration?: number
  immediate?: boolean
  concurrent?: boolean
}

/** A cross on a section's lane, e.g. a crash. Only valid inside a section. */
export type LaneFailure = { fail: string }

/**
 * A note beside a lane, level with the last thing drawn. It goes on the
 * right unless `left` is set, e.g. to keep it clear of arrows.
 */
export type LaneNote = { note: string; lane: string; left?: boolean }

/**
 * A dotted line across the diagram. Unlabelled, it separates steps, e.g.
 * attempts. Labelled, it marks a moment, e.g. a timeout, so the next step
 * starts on it. The label sits at its right end, clear of the lanes.
 */
export type Divider = { divider: true | string }

/**
 * A labelled activation bar on a lane, from its first step to the last
 * thing drawn on that lane. Sections can nest one level deep, on the same
 * lane, e.g. for the stages of a larger step. A nested bar sits on top of
 * its outer bar, shifted right, and its label is indented below the outer
 * one.
 */
export type Section = { section: string; lane: string; steps: Step[] }

/**
 * Branches that run at the same time. Each branch starts half a step after
 * the one before it, so their arrows interleave.
 */
export type Parallel = { parallel: Step[][] }

// Inconsolata's advance width is half an em.
const LABEL_SIZE = 15
const HEADING_SIZE = 17
const LINE_HEIGHT = 18
// Puts the visual centre of a line of text on its y coordinate.
const BASELINE_SHIFT = 5
// Where that visual centre really is, relative to the y coordinate, when
// fitting a background behind the text.
const TEXT_CENTRE = 1
const LABEL_PADDING = 4

const MARGIN = 20
const LANE_GAP = 185
const TITLE_Y = 30
const LIFELINE_TOP = 45
const LIFELINE_OVERHANG = 30
const FIRST_STEP = 80

const CALL_DROP = 40
const REPLY_DROP = 30
const STEP_GAP = 30
const STEP = CALL_DROP + REPLY_DROP + STEP_GAP

const BAR_HALF_WIDTH = 3.5
const BAR_OVERHANG = 5
const NESTED_BAR_OFFSET = 4
const SECTION_LABEL_GAP = 18
// How much further left an outer section's label sits than its nested ones.
const SECTION_INDENT = 15
// Between a lane, or a cross on it, and a label beside it.
const SIDE_LABEL_GAP = 16

const CROSS_HALF = 7
const FAIL_GAP = 20
// How far across its gap a failed call gets before it stops.
const FAIL_FRACTION = 0.6

// A labelled divider marks a moment, so how far it sits below the step
// before it is how long after that step the moment comes.
const DIVIDER_GAP = 40
const SEPARATOR_GAP = 20

type Context = {
  name: string
  laneX: Record<string, number>
  lastX: number
  /** The innermost activation bar, inside a section. */
  bar?: Bar
  /** The y the last call was sent at. */
  lastSent?: number
  out: string[]
  bars: string[]
  /** Dividers are y coordinates, as their width is only known at the end. */
  dividers: number[]
  /** The furthest right any label reaches. */
  right: number
}

type Bar = {
  lane: string
  /** The bar's centre, which is off the lifeline when nested. */
  x: number
  /** The last y drawn on `lane`, where the bar ends. */
  end: number
  outer?: Bar
}

/** Renders a sequence diagram as an inline SVG, prefixing its IDs with `name`. */
export function render(name: string, diagram: Sequence): string {
  const titles = Object.values(diagram.lanes)
  const left = Math.ceil(
    Math.max(
      MARGIN + textWidth(titles[0], HEADING_SIZE) / 2,
      MARGIN + leftReach(diagram.steps, Object.keys(diagram.lanes)[0]),
    ),
  )
  const laneX: Record<string, number> = {}
  Object.keys(diagram.lanes).forEach((id, i) => {
    laneX[id] = left + i * LANE_GAP
  })
  const lastX = left + (titles.length - 1) * LANE_GAP

  const ctx: Context = {
    name,
    laneX,
    lastX,
    out: [],
    bars: [],
    dividers: [],
    right: lastX + textWidth(titles[titles.length - 1], HEADING_SIZE) / 2,
  }
  const end = layout(ctx, diagram.steps, FIRST_STEP - STEP_GAP)

  const width = Math.ceil(ctx.right + MARGIN)
  const lifelineBottom = end + LIFELINE_OVERHANG
  const height = lifelineBottom + MARGIN

  const header = Object.entries(diagram.lanes).map(
    ([id, title]) =>
      `  <text class="d-heading" x="${n(laneX[id])}" y="${TITLE_Y}" text-anchor="middle" fill="currentColor">${escape(title)}</text>`,
  )
  const lifelines = Object.values(laneX)
    .map((x) => `M${n(x)},${LIFELINE_TOP} V${lifelineBottom}`)
    .join(' ')

  // Under everything else, as arrows and their labels can cross them.
  const dividers = ctx.dividers.map(
    (y) => `  <path class="d-line d-dotted d-muted" d="M${MARGIN},${y} H${width - MARGIN}" ${dotted}/>`,
  )

  return [
    `<svg class="diagram" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '  <defs>',
    `    <marker id="${name}-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">`,
    '      <path class="d-arrowhead" d="M0,0 L10,5 L0,10 z" fill="currentColor"/>',
    '    </marker>',
    '  </defs>',
    '',
    ...header,
    `  <path class="d-line d-thin d-dashed d-muted" d="${lifelines}" fill="none" stroke="currentColor" ${dashed}/>`,
    ...dividers,
    '',
    ...ctx.bars,
    '',
    ...ctx.out,
    '</svg>',
    '',
  ].join('\n')
}

/**
 * Lays out `steps` after the point `y`, returning the y of the last thing
 * drawn.
 */
function layout(ctx: Context, steps: Step[], y: number): number {
  for (const step of steps) {
    if ('section' in step) y = section(ctx, step, y)
    else if ('parallel' in step) y = parallel(ctx, step, y)
    else if ('divider' in step) y = divider(ctx, step, y)
    else if ('note' in step) y = laneNote(ctx, step, y)
    else if ('from' in step) y = call(ctx, step, y)
    else y = laneFailure(ctx, step, y)
  }
  return y
}

function section(ctx: Context, step: Section, y: number): number {
  const outer = ctx.bar
  if (outer?.outer) throw new Error('Sections can only nest one level deep')
  if (outer && outer.lane !== step.lane) throw new Error('A nested section must be on the same lane')
  const laneX = lane(ctx, step.lane)
  const nests = step.steps.some((s) => 'section' in s)

  // Level with the start of the first step.
  const first = startOf(ctx, step.steps[0], y)
  const top = first - BAR_OVERHANG
  const labelX = laneX - SECTION_LABEL_GAP - (nests ? SECTION_INDENT : 0)
  ctx.out.push(
    `  <text x="${n(labelX)}" y="${first + BASELINE_SHIFT}" text-anchor="end" fill="currentColor">${escape(step.section)}</text>`,
  )
  // Drawn before any nested bars, which are only known later, so they cover it.
  const index = ctx.bars.push('') - 1

  const bar = { lane: step.lane, x: laneX + (outer ? NESTED_BAR_OFFSET : 0), end: first, outer }
  ctx.bar = bar
  // A nested section starting straight away would put its label on this
  // one's, so it starts a line later.
  const end = layout(ctx, step.steps, 'section' in step.steps[0] ? y + LINE_HEIGHT : y)
  ctx.bar = outer

  const bottom = bar.end + BAR_OVERHANG
  // The outer bar reaches past the end of a nested one.
  if (outer) outer.end = Math.max(outer.end, bottom)
  ctx.bars[index] =
    `  <rect class="d-shape d-thin d-knockout" x="${n(bar.x - BAR_HALF_WIDTH)}" y="${top}" width="${BAR_HALF_WIDTH * 2}" height="${bottom - top}" fill="none" stroke="currentColor"/>`
  return end
}

function parallel(ctx: Context, step: Parallel, y: number): number {
  const ends = step.parallel.map((branch, i) =>
    layout(ctx, branch, y + (i * STEP) / 2),
  )
  return Math.max(y, ...ends)
}

function divider(ctx: Context, step: Divider, y: number): number {
  if (typeof step.divider === 'string') {
    const at = y + DIVIDER_GAP
    ctx.dividers.push(at)
    ctx.out.push(label(ctx, step.divider, { x: ctx.lastX + SIDE_LABEL_GAP, y: at }, 'start'))
    // Steps start one gap after the point returned.
    return at - STEP_GAP
  }
  const at = y + SEPARATOR_GAP
  ctx.dividers.push(at)
  // The next step starts one gap later, so it sits the same distance below.
  return at + SEPARATOR_GAP - STEP_GAP
}

function call(ctx: Context, step: Call, y: number): number {
  const fromX = lane(ctx, step.from)
  const toX = lane(ctx, step.to)
  const direction = Math.sign(toX - fromX)
  if (direction === 0) throw new Error(`Call from ${step.from} to itself`)

  const start = {
    x: edge(ctx, step.from, fromX, direction),
    y: startOf(ctx, step, y),
  }
  ctx.lastSent = start.y
  touch(ctx, step.from, start.y)
  // Taller labels need a longer line, or they run into the reply's label.
  const extraLines = (step.label ?? '').split('\n').length - 1
  const arrive = {
    x: edge(ctx, step.to, toX, -direction),
    y: start.y + CALL_DROP * (step.duration ?? 1) + (extraLines * LINE_HEIGHT) / 2,
  }

  if (step.fail !== undefined) {
    const stop = {
      x: start.x + (arrive.x - start.x) * FAIL_FRACTION,
      y: start.y + (arrive.y - start.y) * FAIL_FRACTION,
    }
    ctx.out.push(line(start, stop, 'd-line'))
    if (step.label) ctx.out.push(label(ctx, step.label, midpoint(start, stop)))
    return failure(ctx, stop, step.fail, 'below')
  }

  ctx.out.push(arrow(ctx, start, arrive, 'd-line'))
  if (step.label) ctx.out.push(label(ctx, step.label, midpoint(start, arrive)))
  touch(ctx, step.to, arrive.y)
  if (step.reply === undefined) return arrive.y

  const back = { x: start.x, y: arrive.y + REPLY_DROP }
  touch(ctx, step.from, back.y)
  ctx.out.push(arrow(ctx, arrive, back, 'd-line d-dashed', dashed))
  if (typeof step.reply === 'string') {
    ctx.out.push(label(ctx, step.reply, midpoint(arrive, back)))
  }
  return back.y
}

function laneFailure(ctx: Context, step: LaneFailure, y: number): number {
  if (!ctx.bar) throw new Error('A lane failure must be inside a section')
  const at = y + FAIL_GAP
  touch(ctx, ctx.bar.lane, at)
  return failure(ctx, { x: ctx.bar.x, y: at }, step.fail, 'right')
}

/** Where `step` starts, given that the step before it ended at `y`. */
function startOf(ctx: Context, step: Step | undefined, y: number): number {
  if (step && 'from' in step) {
    if (step.concurrent) {
      if (ctx.lastSent === undefined) throw new Error('A concurrent call needs a call before it')
      return ctx.lastSent + STEP_GAP
    }
    if (step.immediate) return y
  }
  return y + STEP_GAP
}

/** Extends the activation bar to `y`, if `id` is the lane with the bar. */
function touch(ctx: Context, id: string, y: number) {
  if (ctx.bar && id === ctx.bar.lane) ctx.bar.end = Math.max(ctx.bar.end, y)
}

function laneNote(ctx: Context, step: LaneNote, y: number): number {
  const side = step.left ? -1 : 1
  const x = edge(ctx, step.lane, lane(ctx, step.lane), side) + side * SIDE_LABEL_GAP
  // The first line is level with `y`, and any others hang below it.
  const extra = ((step.note.split('\n').length - 1) * LINE_HEIGHT) / 2
  ctx.out.push(label(ctx, step.note, { x, y: y + extra }, step.left ? 'end' : 'start'))
  return y + extra * 2
}

/** Draws an alert cross centred on `at`, returning its y. */
function failure(
  ctx: Context,
  at: Point,
  text: string,
  placement: 'right' | 'below',
): number {
  const c = CROSS_HALF
  const cross = `  <path class="d-line d-cross" d="M${n(at.x - c)},${n(at.y - c)} l${c * 2},${c * 2} M${n(at.x + c)},${n(at.y - c)} l${-c * 2},${c * 2}" fill="none" stroke="currentColor"/>`

  const labelled =
    placement === 'right'
      ? label(ctx, text, { x: at.x + SIDE_LABEL_GAP, y: at.y }, 'start')
      : label(ctx, text, { x: at.x, y: at.y + c + LINE_HEIGHT - BASELINE_SHIFT })

  ctx.out.push('  <g class="d-alert">', `  ${cross}`, labelled, '  </g>')
  return at.y
}

type Point = { x: number; y: number }

/**
 * Where a line to or from a lane meets it: the edge of its activation bar,
 * on the side facing `direction`, or the lifeline itself.
 */
function edge(ctx: Context, id: string, x: number, direction: number): number {
  return ctx.bar && id === ctx.bar.lane ? ctx.bar.x + direction * BAR_HALF_WIDTH : x
}

function lane(ctx: Context, id: string): number {
  const x = ctx.laneX[id]
  if (x === undefined) throw new Error(`Unknown lane: ${id}`)
  return x
}

function arrow(ctx: Context, a: Point, b: Point, cls: string, extra = ''): string {
  return line(a, b, cls, `marker-end="url(#${ctx.name}-arrow)"${extra ? ' ' + extra : ''}`)
}

function line(a: Point, b: Point, cls: string, extra = ''): string {
  return `  <path class="${cls}" d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(b.y)}" fill="none" stroke="currentColor"${extra ? ' ' + extra : ''}/>`
}

/**
 * A label centred vertically on `at`, on a background so it can sit over a
 * line. A halo would be simpler, but strokes wide enough to bridge the gaps
 * between glyphs leave holes inside some of them, e.g. after a colon.
 */
function label(
  ctx: Context,
  text: string,
  at: Point,
  anchor: 'middle' | 'start' | 'end' = 'middle',
): string {
  const lines = text.split('\n')
  const width = Math.max(...lines.map((l) => textWidth(l, LABEL_SIZE)))
  const left = { middle: at.x - width / 2, start: at.x, end: at.x - width }[anchor]
  ctx.right = Math.max(ctx.right, left + width)

  const height = lines.length * LINE_HEIGHT
  const background = `  <rect class="d-knockout" x="${n(left - LABEL_PADDING)}" y="${n(at.y + TEXT_CENTRE - height / 2)}" width="${n(width + LABEL_PADDING * 2)}" height="${height}" fill="none"/>`

  const x = n(at.x)
  const first = at.y + BASELINE_SHIFT - ((lines.length - 1) * LINE_HEIGHT) / 2
  const element =
    lines.length === 1
      ? `<text x="${x}" y="${n(first)}" text-anchor="${anchor}" fill="currentColor">${escape(text)}</text>`
      : `<text x="${x}" text-anchor="${anchor}" fill="currentColor">` +
        lines
          .map((l, i) => `<tspan x="${x}" y="${n(first + i * LINE_HEIGHT)}">${escape(l)}</tspan>`)
          .join('') +
        '</text>'
  return `${background}\n  ${element}`
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * How far left of the first lane its labels reach: section labels, and
 * notes on its left.
 */
function leftReach(steps: Step[], firstLane: string): number {
  return Math.max(
    0,
    ...steps.map((s) => {
      if ('section' in s) {
        return Math.max(
          SECTION_LABEL_GAP +
            (s.steps.some((t) => 'section' in t) ? SECTION_INDENT : 0) +
            textWidth(s.section, LABEL_SIZE),
          leftReach(s.steps, firstLane),
        )
      }
      if ('parallel' in s) return Math.max(0, ...s.parallel.map((b) => leftReach(b, firstLane)))
      if ('note' in s && s.left && s.lane === firstLane) {
        const width = Math.max(...s.note.split('\n').map((l) => textWidth(l, LABEL_SIZE)))
        return BAR_HALF_WIDTH + SIDE_LABEL_GAP + width
      }
      return 0
    }),
  )
}

function textWidth(text: string, size: number): number {
  return text.length * size * 0.5
}

// Feed readers drop the site's CSS, so lines carry their dash pattern too.
const dashed = 'stroke-dasharray="7 6"'
const dotted = 'stroke-dasharray="0 7" stroke-linecap="round"'

/** Formats a coordinate without floating-point noise. */
function n(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
