#!/usr/bin/env node
/**
 * Cross-checks content/courses.yaml against the files actually present under
 * public/courses. Run it before deploying: the site builds fine with missing
 * files, they just 404 for readers.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const contentPath = join(root, 'content', 'courses.yaml')
const filesRoot = join(root, 'public', 'courses')

const walk = (dir) => {
  let out = []
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of names) {
    if (name.startsWith('.')) continue
    const full = join(dir, name)
    out = statSync(full).isDirectory() ? out.concat(walk(full)) : out.concat(full)
  }
  return out
}

const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size >= 10 || unit === 0 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`
}

let content
try {
  content = yaml.load(readFileSync(contentPath, 'utf8'), { schema: yaml.CORE_SCHEMA })
} catch (error) {
  console.error(`content/courses.yaml is not valid YAML:\n${error.message}`)
  process.exit(1)
}

const onDisk = new Map(
  walk(filesRoot).map((file) => [
    relative(filesRoot, file).split(sep).join('/'),
    statSync(file).size,
  ]),
)

const referenced = new Set()
const missing = []
let totalBytes = 0

for (const course of content.courses ?? []) {
  const folder = course.folder ?? course.id
  const check = (file, label) => {
    if (!file || /^https?:/.test(file)) return
    const path = `${folder}/${String(file).replace(/^\/+/, '')}`
    referenced.add(path)
    const size = onDisk.get(path)
    if (size === undefined) missing.push({ path, course: course.code ?? course.id, label })
    else totalBytes += size
  }
  for (const material of course.materials ?? []) check(material.file, material.title)
  for (const assignment of course.assignments ?? []) check(assignment.attachment, assignment.title)
}

const orphans = [...onDisk.keys()].filter((path) => !referenced.has(path)).sort()

console.log(`content/courses.yaml — ${(content.courses ?? []).length} courses`)
console.log(
  `public/courses    — ${onDisk.size} files, ${referenced.size} referenced, ${formatBytes(totalBytes)} resolved`,
)

if (missing.length > 0) {
  console.log(`\nMissing (${missing.length}) — referenced in YAML, not on disk:`)
  for (const item of missing) console.log(`  ${item.path}\n      ${item.course}: ${item.label}`)
}

if (orphans.length > 0) {
  console.log(`\nUnreferenced (${orphans.length}) — on disk, not in YAML:`)
  for (const path of orphans) console.log(`  ${path}`)
}

if (missing.length === 0 && orphans.length === 0) console.log('\nEverything referenced is present.')

// Missing files are a warning by default; --strict makes them fail a release.
process.exit(process.argv.includes('--strict') && missing.length > 0 ? 1 : 0)
