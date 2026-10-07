/**
 * Copies a diagram's `width` attribute into a `--diagram-width` custom
 * property, so the site's CSS can scale the diagram relative to its natural
 * size. CSS can't read the attribute itself.
 *
 * A diagram that already has the property is left as it is, so applying
 * this again changes nothing.
 */
export function addWidthProperty(svg: string): string {
  return svg.replace(/<svg\b([^>]*)>/, (tag, attrs: string) => {
    if (/--diagram-width:/.test(attrs)) return tag
    if (/\sstyle="/.test(attrs)) throw new Error(`Diagram already has a style: ${tag}`)
    const width = /\swidth="([\d.]+)"/.exec(attrs)?.[1]
    if (width === undefined) throw new Error(`Diagram has no width: ${tag}`)
    return `<svg${attrs} style="--diagram-width: ${width}px">`
  })
}
