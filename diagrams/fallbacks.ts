/**
 * Adds presentation attributes to a diagram, for feed readers, which show
 * the SVG without the site's CSS. The CSS overrides every one of them, so
 * on the site they change nothing.
 *
 * Only attributes an element doesn't already have are added, so applying
 * this again changes nothing.
 */

// Most monospace fonts advance 0.6em per character, so 12.5px gives
// Inconsolata's 7.5px at 15px, and text keeps its place in the layout.
const ROOT = { 'font-family': 'monospace', 'font-size': '12.5' }

// Fixed colours can't follow a reader's theme, so these are the palette's
// mid-tones (public/css/_sass/_variables.scss), which read on light and
// dark backgrounds alike. Unclassed ink follows the reader's text colour.
const BY_CLASS: Record<string, Record<string, string>> = {
  'd-muted': { color: '#888888' },
  'd-accent': { color: '#477dca' },
  'd-alert': { color: '#ed6145' },
  'd-success': { color: '#5e9e3a' },
  'd-warning': { color: '#d97706' },
  'd-heading': { 'font-size': '14.17', 'font-weight': 'bold' },
  'd-bold': { 'font-weight': 'bold' },
}

export function addFallbacks(svg: string): string {
  return svg.replace(/<([a-z]+)\b([^>]*?)(\/?)>/g, (tag, name: string, attrs: string, close: string) => {
    const classes = /\bclass="([^"]*)"/.exec(attrs)?.[1].split(/\s+/) ?? []
    const wanted = {
      ...(name === 'svg' && classes.includes('diagram') ? ROOT : {}),
      ...Object.assign({}, ...classes.map((c) => BY_CLASS[c] ?? {})),
    }
    const missing = Object.entries(wanted).filter(
      ([attr]) => !new RegExp(`\\s${attr}="`).test(attrs),
    )
    if (missing.length === 0) return tag
    const extra = missing.map(([attr, value]) => ` ${attr}="${value}"`).join('')
    return `<${name}${attrs.replace(/\s+$/, '')}${extra}${close ? '/' : ''}>`
  })
}
