import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const nuxtBinary = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'nuxt.cmd' : 'nuxt'
)

const host = '127.0.0.1'
const port = process.env.PORT ?? '3000'
const passThroughArgs = process.argv.slice(2)
const nuxtArgs = ['dev', '--host', host, '--port', port, ...passThroughArgs]

const runner = spawn(nuxtBinary, nuxtArgs, {
  stdio: 'inherit',
  env: {
    ...process.env
  }
})

runner.on('exit', (code, signal) => {
  if (typeof code === 'number') {
    process.exitCode = code
  } else if (signal) {
    process.exitCode = 1
  }
})
