/**
 * Checks that every post has a usable description. Without `description`
 * front matter, jekyll-seo-tag uses the post's excerpt: everything up to the
 * first blank line. A post opening with an epigraph, callout or other
 * non-paragraph block gets that as its description, or the site's if it
 * renders to nothing. Run from anywhere:
 * node scripts/description.ts
 *
 * Exits non-zero, listing the posts that need a `description`.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '..')

/** Returns whether `source` needs `description` front matter. */
export function needsDescription(source: string): boolean {
  const match = source.match(/^---\n([\s\S]*?\n)---\n/)
  if (match && /^description:/m.test(match[1])) return false

  const body = match ? source.slice(match[0].length) : source
  const excerpt = body.trimStart().split('\n\n')[0]
  // The plugin strips HTML, so a comment directly above a paragraph is fine.
  const text = excerpt.replace(/<!--[\s\S]*?-->/g, '').trim()

  return !/^[\p{L}\p{N}*_[("'`]/u.test(text) || text.startsWith('```')
}

if (import.meta.main) {
  const dir = join(root, '_posts')
  const missing: string[] = []

  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.md')).sort()) {
    const path = join(dir, file)
    if (needsDescription(await readFile(path, 'utf8'))) missing.push(relative(root, path))
  }

  for (const path of missing) console.log(path)
  if (missing.length > 0) {
    console.error(
      "These posts don't open with a paragraph, so need a description in their front matter.",
    )
    process.exitCode = 1
  }
}
