import { copyFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, posix, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { CORE_SCHEMA, load as loadYaml } from 'js-yaml'
import { defineConfig, type Plugin } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const COURSE_FILES_ROOT = join(root, 'public', 'courses')

/**
 * Where the built site is served from. The deploy workflow asks the Pages API
 * and passes the answer in BASE_PATH, which covers a custom domain (/), a user
 * site (/) and a project site (/<repo>/) without anyone having to remember.
 * The default suits this repository's custom domain; set BASE_PATH for a manual
 * build that lands somewhere else. The dev server always stays at /.
 */
const productionBase = process.env.BASE_PATH ?? '/'

/** Lets `import content from '../content/courses.yaml'` work like JSON. */
function yamlPlugin(): Plugin {
  return {
    name: 'course-hub:yaml',
    transform(code, id) {
      if (!/\.ya?ml$/.test(id)) return null
      try {
        // CORE_SCHEMA keeps dates as strings so the loader can read them as local time.
        const parsed = loadYaml(code, { schema: CORE_SCHEMA })
        return { code: `export default ${JSON.stringify(parsed)}`, map: null }
      } catch (error) {
        this.error(`${id} is not valid YAML.\n${(error as Error).message}`)
      }
    },
  }
}

function walk(dir: string): string[] {
  let entries: string[] = []
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) entries = entries.concat(walk(full))
    else entries.push(full)
  }
  return entries
}

/**
 * Exposes the real size of everything under public/courses as a virtual module,
 * so the YAML does not have to carry file sizes by hand. The files themselves
 * are not committed, so this map is empty on a fresh clone and the UI simply
 * omits sizes.
 */
function courseFilesPlugin(): Plugin {
  const virtualId = 'virtual:course-files'
  const resolvedId = '\0' + virtualId

  const scan = () => {
    const sizes: Record<string, number> = {}
    try {
      for (const file of walk(COURSE_FILES_ROOT)) {
        sizes[posix.join(...relative(COURSE_FILES_ROOT, file).split(/[\\/]/))] = statSync(file).size
      }
    } catch {
      /* the folder may not exist yet */
    }
    return sizes
  }

  return {
    name: 'course-hub:course-files',
    resolveId: (id) => (id === virtualId ? resolvedId : null),
    load: (id) => (id === resolvedId ? `export default ${JSON.stringify(scan())}` : null),
    configureServer(server) {
      // Dropping a file into public/courses should be picked up without a restart.
      server.watcher.add(COURSE_FILES_ROOT)
      const invalidate = (path: string) => {
        if (!path.startsWith(COURSE_FILES_ROOT)) return
        const mod = server.moduleGraph.getModuleById(resolvedId)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', invalidate)
      server.watcher.on('unlink', invalidate)
    },
  }
}

/**
 * GitHub Pages has no SPA rewrite. Serving the same document as 404.html makes
 * a deep link like /courses/ce-341 boot the app instead of showing Pages' 404.
 */
function spaFallbackPlugin(): Plugin {
  let outDir = 'dist'
  return {
    name: 'course-hub:spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    closeBundle() {
      // index.html is written by Vite's own html plugin, so copy it afterwards.
      copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'))
      // Stops GitHub Pages from running the output through Jekyll.
      writeFileSync(join(outDir, '.nojekyll'), '')
    },
  }
}

export default defineConfig(({ command, isPreview }) => ({
  // `preview` serves the built output, so it needs the deployed base too.
  base: command === 'build' || isPreview ? productionBase : '/',
  plugins: [react(), yamlPlugin(), courseFilesPlugin(), spaFallbackPlugin()],
}))
