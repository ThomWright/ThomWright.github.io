/**
 * Sets each page's `last_modified_at` front matter to the latest date in its
 * `changes` list. jekyll-seo-tag and jekyll-sitemap read `last_modified_at`,
 * and GitHub Pages can't run a plugin to derive it at build time. Pages
 * without `changes` are left alone. Run from anywhere:
 * node scripts/last-modified.ts
 *
 * With --check, changes nothing and exits non-zero if any page is out of
 * date.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '..')
const dirs = ['_posts', '_drafts', '_failure-patterns', '_wip']

/** Returns `source` with `last_modified_at` matching its latest change. */
export function syncLastModified(source: string): string {
  const match = source.match(/^---\n([\s\S]*?\n)---\n/)
  if (!match) return source

  const lines = match[1].split('\n')
  const start = lines.indexOf('changes:')
  if (start === -1) return source

  // The list continues while lines are indented or are `- ` items, as YAML
  // allows list items at the same indent as their key.
  let end = start + 1
  while (end < lines.length && /^[\s-]/.test(lines[end])) end++

  const dates = lines
    .slice(start + 1, end)
    .map((line) => line.match(/^[\s-]*date:\s*(\d{4}-\d{2}-\d{2})/)?.[1])
    .filter((date) => date !== undefined)
  if (dates.length === 0) return source

  const latest = `last_modified_at: ${dates.sort().at(-1)}`
  const existing = lines.findIndex((line) => line.startsWith('last_modified_at:'))
  if (existing === -1) lines.splice(end, 0, latest)
  else lines[existing] = latest

  return `---\n${lines.join('\n')}---\n${source.slice(match[0].length)}`
}

if (import.meta.main) {
  const check = process.argv.includes('--check')
  const stale: string[] = []

  for (const dir of dirs) {
    const files = await readdir(join(root, dir)).catch(() => [])
    for (const file of files.filter((f) => f.endsWith('.md')).sort()) {
      const path = join(root, dir, file)
      const source = await readFile(path, 'utf8')
      const synced = syncLastModified(source)
      if (synced === source) continue

      stale.push(relative(root, path))
      if (!check) await writeFile(path, synced)
    }
  }

  for (const path of stale) console.log(path)
  if (check && stale.length > 0) {
    console.error('last_modified_at is out of date. Run: node scripts/last-modified.ts')
    process.exitCode = 1
  }
}
