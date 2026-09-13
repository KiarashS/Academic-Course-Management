#!/usr/bin/env node
/**
 * Moves public/courses in and out of a GitHub release asset.
 *
 * The files are published with the site but deliberately never enter git
 * history, so a clone stays small no matter how large the material set gets.
 * A release asset is the only place on GitHub that a `git clone` does not
 * touch — anything committed, Git LFS included, comes down by default.
 *
 *   node scripts/course-files.mjs push    bundle public/courses and upload it
 *   node scripts/course-files.mjs pull    download the bundle and unpack it
 *   node scripts/course-files.mjs status  show what is here and what is there
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const TAG = process.env.COURSE_FILES_TAG ?? 'course-files'
const ASSET = 'course-files.tar.gz'

const root = fileURLToPath(new URL('..', import.meta.url))
const filesRoot = join(root, 'public', 'courses')
const bundle = join(root, ASSET)

const run = (command, args, options = {}) =>
  spawnSync(command, args, { stdio: 'inherit', cwd: root, ...options })

const capture = (command, args) =>
  spawnSync(command, args, { cwd: root, encoding: 'utf8' })

function requireGh() {
  const probe = capture('gh', ['--version'])
  if (probe.error || probe.status !== 0) {
    console.error(
      'This needs the GitHub CLI.\n' +
        '  install:  https://cli.github.com\n' +
        '  sign in:  gh auth login',
    )
    process.exit(1)
  }
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

function walk(dir) {
  let out = []
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of names) {
    if (name === '.gitkeep') continue
    const full = join(dir, name)
    out = statSync(full).isDirectory() ? out.concat(walk(full)) : out.concat(full)
  }
  return out
}

function localSummary() {
  const files = walk(filesRoot)
  return { count: files.length, bytes: files.reduce((sum, f) => sum + statSync(f).size, 0) }
}

function push() {
  requireGh()
  const { count, bytes } = localSummary()
  if (count === 0) {
    console.error(`No files under public/courses. Add them first, then push.`)
    process.exit(1)
  }

  console.log(`Bundling ${count} files (${formatBytes(bytes)})…`)
  rmSync(bundle, { force: true })
  // Excluding .gitkeep keeps the bundle to real course material only.
  const tar = run('tar', ['-czf', bundle, '-C', filesRoot, '--exclude=.gitkeep', '.'])
  if (tar.status !== 0) process.exit(tar.status ?? 1)
  console.log(`Bundle is ${formatBytes(statSync(bundle).size)} compressed.`)

  const existing = capture('gh', ['release', 'view', TAG, '--json', 'tagName'])
  if (existing.status !== 0) {
    console.log(`Creating release "${TAG}"…`)
    const created = run('gh', [
      'release', 'create', TAG,
      '--title', 'Course files',
      '--notes',
      'Files served from public/courses. Kept out of git history so clones stay small; ' +
        'the deploy workflow downloads this asset before building.',
    ])
    if (created.status !== 0) process.exit(created.status ?? 1)
  }

  console.log(`Uploading ${ASSET} to "${TAG}"…`)
  const upload = run('gh', ['release', 'upload', TAG, bundle, '--clobber'])
  rmSync(bundle, { force: true })
  if (upload.status !== 0) process.exit(upload.status ?? 1)
  console.log('\nDone. Push to main (or run the workflow) to rebuild the site with these files.')
}

function pull() {
  requireGh()
  console.log(`Downloading ${ASSET} from "${TAG}"…`)
  rmSync(bundle, { force: true })
  const download = run('gh', ['release', 'download', TAG, '--pattern', ASSET, '--dir', root])
  if (download.status !== 0) {
    console.error(`\nNo "${TAG}" release asset yet. Run "npm run files:push" once you have files.`)
    process.exit(download.status ?? 1)
  }
  mkdirSync(filesRoot, { recursive: true })
  const extract = run('tar', ['-xzf', bundle, '-C', filesRoot])
  rmSync(bundle, { force: true })
  if (extract.status !== 0) process.exit(extract.status ?? 1)
  const { count, bytes } = localSummary()
  console.log(`Unpacked ${count} files (${formatBytes(bytes)}) into public/courses.`)
}

function status() {
  const { count, bytes } = localSummary()
  console.log(`local   public/courses — ${count} files, ${formatBytes(bytes)}`)
  const probe = capture('gh', ['--version'])
  if (probe.error || probe.status !== 0) {
    console.log('remote  (install the GitHub CLI to check the release)')
    return
  }
  const view = capture('gh', ['release', 'view', TAG, '--json', 'assets'])
  if (view.status !== 0) {
    console.log(`remote  no "${TAG}" release yet — run "npm run files:push"`)
    return
  }
  const assets = JSON.parse(view.stdout).assets ?? []
  const asset = assets.find((a) => a.name === ASSET)
  console.log(
    asset
      ? `remote  ${TAG}/${ASSET} — ${formatBytes(asset.size)}, updated ${asset.updatedAt ?? '?'}`
      : `remote  release "${TAG}" exists but has no ${ASSET}`,
  )
}

const command = process.argv[2]
if (command === 'push') push()
else if (command === 'pull') pull()
else if (command === 'status') status()
else {
  console.error('Usage: node scripts/course-files.mjs <push|pull|status>')
  process.exit(1)
}
