/**
 * Sketched charts in the house style (see public/css/_sass/_diagrams.scss):
 * a pair of axes with shaded areas, lines and arrows drawn against them,
 * e.g. an error rate against an alert window.
 *
 * Everything is placed in the axes' own units, such as minutes and percent,
 * so a chart is to scale unless an axis says otherwise.
 */

export type Plot = {
  /** Above the y axis. */
  title: string
  x: Axis
  y: Axis
  /** Below the x axis, at its right end. */
  xTitle?: string
  areas?: Area[]
  /** A dashed line across the chart, e.g. the error rate an SLO allows, labelled at its end. */
  slo?: Slo
  lines?: Line[]
  arrows?: Arrow[]
  notes?: Note[]
}

/**
 * Either the values at the start and end of the axis, or, for an axis that
 * isn't to scale, values mapped to fractions of its length, including its
 * start (0) and end (1). Values between them are interpolated.
 */
export type Axis = ({ domain: [number, number] } | { scale: [number, number][] }) & {
  ticks?: Tick[]
}

/** A labelled mark on an axis. `anchor` aligns an x tick's label. */
export type Tick = { at: number; label: string; anchor?: 'start' | 'middle' | 'end' }

/**
 * A rectangle from the x axis up to `height`, between two x values.
 *
 * - `window`: an alert window, as tall as its error threshold
 * - `short-window`: a second, shorter alert window
 * - `errors`: the errors seen in that time
 */
export type Area = { kind: 'window' | 'short-window' | 'errors'; from: number; to: number; height: number }

export type Slo = { at: number; label?: string }

/** A solid line, labelled at its end. */
export type Line = { from: Point; to: Point; label: string; colour: Colour }

export type Arrow = { from: Point; to: Point; colour?: Colour }

/** Text centred on a point, one line per entry. */
export type Note = { at: Point; text: string[]; colour?: Colour }

export type Point = [x: number, y: number]

export type Colour = 'ink' | 'muted' | 'accent' | 'alert' | 'success' | 'warning'

// Inconsolata's advance width is half an em.
const TEXT_SIZE = 15
const CHAR_WIDTH = TEXT_SIZE / 2
// Puts the visual centre of a line of text on its y coordinate.
const BASELINE_SHIFT = 5
const LINE_HEIGHT = 20

const MARGIN = 20
const TITLE_Y = 30
// Wide enough for a y tick label like "1.44%".
const AXIS_X = MARGIN + 5 * CHAR_WIDTH + 14
const PLOT_TOP = 56
const PLOT_WIDTH = 250
const PLOT_HEIGHT = 160
const TICK = 5
const TICK_LABEL_GAP = 6
const X_LABEL_Y = PLOT_TOP + PLOT_HEIGHT + 24
const LINE_LABEL_GAP = 8

const AREA_CLASS: Record<Area['kind'], string> = {
  window: 'd-warning',
  'short-window': '',
  errors: 'd-alert',
}

// Feed readers drop the site's CSS, so shapes carry their styles too.
const TINT = 'fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.5"'
const LINE = 'fill="none" stroke="currentColor"'
const DASHED = 'stroke-dasharray="7 6"'

/** Renders a plot as an inline SVG, prefixing its IDs with `name`. */
export function render(name: string, plot: Plot): string {
  const px = (x: number): number => AXIS_X + position(plot.x, x) * PLOT_WIDTH
  const py = (y: number): number => PLOT_TOP + PLOT_HEIGHT - position(plot.y, y) * PLOT_HEIGHT
  const right = AXIS_X + PLOT_WIDTH
  const bottom = PLOT_TOP + PLOT_HEIGHT

  let maxX = right
  let maxY = X_LABEL_Y
  const text = (x: number, y: number, content: string, attrs: string, anchor = 'start'): string => {
    const width = content.length * CHAR_WIDTH
    const end = anchor === 'start' ? x + width : anchor === 'middle' ? x + width / 2 : x
    maxX = Math.max(maxX, end)
    maxY = Math.max(maxY, y)
    const anchorAttr = anchor === 'start' ? '' : ` text-anchor="${anchor}"`
    const classAttr = attrs ? ` class="${attrs}"` : ''
    return `<text${classAttr} x="${n(x)}" y="${n(y + BASELINE_SHIFT)}"${anchorAttr} fill="currentColor">${escape(content)}</text>`
  }

  const areas = (plot.areas ?? []).map((a) => {
    const x = px(a.from)
    const y = py(a.height)
    const cls = ['d-shape', 'd-tint', AREA_CLASS[a.kind]].filter(Boolean).join(' ')
    return `  <rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(px(a.to) - x)}" height="${n(bottom - y)}" ${TINT}/>`
  })

  const slo = plot.slo
    ? [
        '  <g class="d-accent">',
        `    <path class="d-line d-dashed" d="M${AXIS_X},${n(py(plot.slo.at))} H${right}" ${LINE} ${DASHED}/>`,
        ...(plot.slo.label
          ? [`    ${text(right + LINE_LABEL_GAP, py(plot.slo.at), plot.slo.label, '')}`]
          : []),
        '  </g>',
      ]
    : []

  const lines = (plot.lines ?? []).map((l) => {
    const [x2, y2] = [px(l.to[0]), py(l.to[1])]
    return [
      `  <g${colourAttr(l.colour)}>`,
      `    <path class="d-line" d="M${n(px(l.from[0]))},${n(py(l.from[1]))} L${n(x2)},${n(y2)}" ${LINE}/>`,
      `    ${text(x2 + LINE_LABEL_GAP, y2, l.label, 'd-bold')}`,
      '  </g>',
    ].join('\n')
  })

  const markers = new Set<Colour>()
  const arrows = (plot.arrows ?? []).map((a) => {
    const colour = a.colour ?? 'ink'
    markers.add(colour)
    const d = `M${n(px(a.from[0]))},${n(py(a.from[1]))} L${n(px(a.to[0]))},${n(py(a.to[1]))}`
    return `  <path class="d-line${classSuffix(colour)}" d="${d}" ${LINE} marker-end="url(#${name}-arrow-${colour})"/>`
  })

  const notes = (plot.notes ?? []).flatMap((note) => {
    const top = py(note.at[1]) - ((note.text.length - 1) * LINE_HEIGHT) / 2
    return note.text.map(
      (t, i) => `  ${text(px(note.at[0]), top + i * LINE_HEIGHT, t, classOf(note.colour ?? 'ink'), 'middle')}`,
    )
  })

  const yTicks = (plot.y.ticks ?? []).flatMap((t) => [
    `  <path class="d-line" d="M${AXIS_X - TICK},${n(py(t.at))} H${AXIS_X}" ${LINE}/>`,
    `  ${text(AXIS_X - TICK - TICK_LABEL_GAP, py(t.at), t.label, '', 'end')}`,
  ])
  const xTicks = (plot.x.ticks ?? []).flatMap((t) => {
    const x = px(t.at)
    const anchor = t.anchor ?? 'middle'
    return [
      `  <path class="d-line" d="M${n(x)},${bottom} V${bottom + TICK}" ${LINE}/>`,
      `  ${text(x, X_LABEL_Y, t.label, '', anchor)}`,
    ]
  })

  const titles = [
    `  ${text(MARGIN, TITLE_Y, plot.title, 'd-heading')}`,
    ...(plot.xTitle ? [`  ${text(right, X_LABEL_Y, plot.xTitle, 'd-heading', 'end')}`] : []),
  ]

  const width = Math.ceil(maxX + MARGIN)
  const height = Math.ceil(maxY + MARGIN)

  return [
    `<svg class="diagram" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ...(markers.size
      ? [
          '  <defs>',
          ...[...markers].flatMap((c) => [
            `    <marker id="${name}-arrow-${c}"${colourAttr(c)} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">`,
            '      <path class="d-arrowhead" d="M0,0 L10,5 L0,10 z" fill="currentColor"/>',
            '    </marker>',
          ]),
          '  </defs>',
          '',
        ]
      : []),
    ...titles,
    '',
    ...areas,
    ...slo,
    ...lines,
    ...arrows,
    ...notes,
    '',
    '  <!-- Axes -->',
    `  <path class="d-line" d="M${AXIS_X},${PLOT_TOP} V${bottom} H${right}" ${LINE}/>`,
    ...yTicks,
    ...xTicks,
    '</svg>',
    '',
  ].join('\n')
}

/** Where a value falls along an axis, from 0 at its start to 1 at its end. */
function position(axis: Axis, value: number): number {
  const points = 'scale' in axis ? axis.scale : [[axis.domain[0], 0], [axis.domain[1], 1]]
  const sorted = [...points].sort(([a], [b]) => a - b)
  if (sorted.length < 2) throw new Error('An axis scale needs at least two points')
  // The pair of points either side of the value, or the nearest pair.
  let i = 1
  while (i < sorted.length - 1 && sorted[i][0] < value) i++
  const [v0, f0] = sorted[i - 1]
  const [v1, f1] = sorted[i]
  return f0 + ((value - v0) / (v1 - v0)) * (f1 - f0)
}

function classOf(colour: Colour): string {
  return colour === 'ink' ? '' : `d-${colour}`
}

function classSuffix(colour: Colour): string {
  return colour === 'ink' ? '' : ` d-${colour}`
}

function colourAttr(colour: Colour): string {
  return colour === 'ink' ? '' : ` class="d-${colour}"`
}

/** Formats a coordinate without floating-point noise. */
function n(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
