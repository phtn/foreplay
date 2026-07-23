import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

const chromeCandidates = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
]

const chromeExecutable = chromeCandidates.find(existsSync)

function runChrome(
  executable: string,
  fixtureUrl: string,
  profileDirectory: string
) {
  return new Promise<string>((resolveOutput, reject) => {
    const browser = spawn(executable, [
      '--headless=new',
      '--disable-gpu',
      '--no-default-browser-check',
      '--no-first-run',
      '--allow-file-access-from-files',
      `--user-data-dir=${profileDirectory}`,
      '--virtual-time-budget=5000',
      '--dump-dom',
      fixtureUrl
    ])
    let output = ''
    let errorOutput = ''

    browser.stdout.on('data', (chunk) => {
      output += String(chunk)
    })
    browser.stderr.on('data', (chunk) => {
      errorOutput += String(chunk)
    })

    const timeout = setTimeout(() => {
      browser.kill('SIGKILL')
    }, 10_000)

    browser.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    browser.on('close', () => {
      clearTimeout(timeout)

      const start = output.indexOf('<output')
      const end = output.indexOf('</output>', start)
      if (start < 0 || end < 0) {
        reject(
          new Error(
            `Browser fixture did not produce a result. ${errorOutput}`
          )
        )
        return
      }

      resolveOutput(output.slice(start, end + '</output>'.length))
    })
  })
}

test(
  'exports a ticket when the document background uses lab()',
  { skip: chromeExecutable === undefined, timeout: 20_000 },
  async () => {
    assert.ok(chromeExecutable)

    const fixtureDirectory = mkdtempSync(
      join(tmpdir(), 'foreplay-ticket-export-')
    )
    const entryPath = join(fixtureDirectory, 'entry.ts')
    const bundlePath = join(fixtureDirectory, 'bundle.js')
    const fixturePath = join(fixtureDirectory, 'fixture.html')
    const exportModulePath = resolve(
      'lib/tickets/download-ticket-png.ts'
    )

    try {
      writeFileSync(
        entryPath,
        `
          import { downloadElementAsPng } from ${JSON.stringify(exportModulePath)}

          const runExport = async () => {
            const result = document.querySelector('#result')
            const ticket = document.querySelector('#ticket')
            result.textContent = 'running'
            Object.defineProperty(document, 'fonts', {
              configurable: true,
              value: { ready: Promise.resolve() }
            })
            window.requestAnimationFrame = (callback) =>
              window.setTimeout(
                () => callback(performance.now()),
                0
              )

            try {
              await downloadElementAsPng(ticket, 'ticket.png')
              result.textContent = 'pass'
            } catch (error) {
              result.textContent = String(error)
            }
          }

          void runExport()
        `
      )

      const build = spawnSync(
        'bun',
        [
          'build',
          entryPath,
          '--target=browser',
          '--format=iife',
          `--outfile=${bundlePath}`
        ],
        {
          encoding: 'utf8'
        }
      )
      assert.equal(
        build.status,
        0,
        build.stderr || build.stdout
      )
      assert.ok(readFileSync(bundlePath).length > 0)

      writeFileSync(
        fixturePath,
        `
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                html, body {
                  background-color: lab(50% 0 0) !important;
                }

                #ticket {
                  background-color: #ffffff;
                  color: lab(35% 0 0) !important;
                  padding: 16px;
                }
              </style>
            </head>
            <body>
              <div id="ticket">Ticket export reproduction</div>
              <output id="result">pending</output>
              <script src="./bundle.js"></script>
            </body>
          </html>
        `
      )

      const output = await runChrome(
        chromeExecutable,
        `file://${fixturePath}`,
        join(fixtureDirectory, 'chrome-profile')
      )

      assert.match(output, />pass<\/output>$/)
    } finally {
      rmSync(fixtureDirectory, {
        force: true,
        recursive: true
      })
    }
  }
)
