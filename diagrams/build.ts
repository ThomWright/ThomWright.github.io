/**
 * Regenerates every diagram in diagrams/sequences/ as
 * _includes/diagrams/<name>.svg. Run from anywhere: node diagrams/build.ts
 */

import { readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { render, type Sequence } from './sequence.ts'

const sources = join(import.meta.dirname, 'sequences')
const output = join(import.meta.dirname, '..', '_includes', 'diagrams')

for (const file of (await readdir(sources)).filter((f) => f.endsWith('.ts')).sort()) {
  const name = basename(file, '.ts')
  const diagram: Sequence = (await import(join(sources, file))).default
  await writeFile(join(output, `${name}.svg`), render(name, diagram))
  console.log(`_includes/diagrams/${name}.svg`)
}
