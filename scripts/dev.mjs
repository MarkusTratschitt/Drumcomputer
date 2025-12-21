import {
  spawn
} from 'node:child_process'
import path from 'node:path'
import {
  fileURLToPath
} from 'node:url'

/**
 * __dirname for ESM
 */
const __dirname = path.dirname(fileURLToPath(
  import.meta.url))

/**
 * Project root (one level above /scripts)
 */
const rootDir = path.resolve(__dirname, '..')

/**
 * Direct entry point for Nuxt CLI (nuxi)
 * → no .bin symlinks, no shebang, no shell:true
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
 * Dev parameters
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
 * Spawn via explicit Node binary
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
 * Forward exit code cleanly
 */
runner.on('exit', (code, signal) => {
  if (typeof code === 'number') {
    process.exitCode = code
  } else if (signal) {
    process.exitCode = 1
  }
})
