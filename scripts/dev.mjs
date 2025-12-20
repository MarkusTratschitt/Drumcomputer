import {
  spawn
} from 'node:child_process'
import path from 'node:path'
import {
  fileURLToPath
} from 'node:url'

/**
 * __dirname für ESM
 */
const __dirname = path.dirname(fileURLToPath(
  import.meta.url))

/**
 * Projekt-Root (1 Level über /scripts o.ä.)
 */
const rootDir = path.resolve(__dirname, '..')

/**
 * Direkter Einstiegspunkt von Nuxt CLI (nuxi)
 * → keine .bin Symlinks, kein Shebang, kein shell:true
 */
const nuxtEntry = path.join(
  rootDir,
  'node_modules',
  '@nuxt',
  'cli',
  'bin',
  'nuxi.mjs'
)

/**
 * Dev-Parameter
 */
const host = '127.0.0.1'
const port = process.env.PORT ?? '3000'
const passThroughArgs = process.argv.slice(2)

const nuxtArgs = [
  nuxtEntry,
  'dev',
  '--host',
  host,
  '--port',
  port,
  ...passThroughArgs
]

/**
 * Spawn über expliziten Node
 */
const runner = spawn(
  process.execPath, // garantiert der richtige Node
  nuxtArgs, {
    stdio: 'inherit',
    cwd: rootDir,
    env: {
      ...process.env
    }
  }
)

/**
 * Exit sauber weiterreichen
 */
runner.on('exit', (code, signal) => {
  if (typeof code === 'number') {
    process.exitCode = code
  } else if (signal) {
    process.exitCode = 1
  }
})