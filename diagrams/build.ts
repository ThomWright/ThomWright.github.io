/**
 * Regenerates every diagram in diagrams/sequences/ and diagrams/timelines/
 * as _includes/diagrams/<name>.svg. Run from anywhere: node diagrams/build.ts
 */

import { readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import * as sequence from './sequence.ts'
import * as timeline from './timeline.ts'

const kinds = { sequences: sequence.render, timelines: timeline.render }
const output = join(import.meta.dirname, '..', '_includes', 'diagrams')

for (const [dir, render] of Object.entries(kinds)) {
  const sources = join(import.meta.dirname, dir)
  for (const file of (await readdir(sources)).filter((f) => f.endsWith('.ts')).sort()) {
    const name = basename(file, '.ts')
    const diagram = (await import(join(sources, file))).default
    await writeFile(join(output, `${name}.svg`), render(name, diagram))
    console.log(`_includes/diagrams/${name}.svg`)
  }
}
