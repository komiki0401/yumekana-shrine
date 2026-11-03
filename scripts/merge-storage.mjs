// Offline only. Never connects to a browser or writes localStorage.
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createServer } from 'vite'
import { planMerge } from './storage-merge.mjs'

const [publicFile, localFile, outputDir] = process.argv.slice(2)
if (!publicFile || !localFile || !outputDir) {
  console.error('Usage: node scripts/merge-storage.mjs public.json local.json NEW_OUTPUT_DIRECTORY')
  process.exit(1)
}
// A new directory is mandatory: existing backups/results cannot be overwritten.
const out = resolve(outputDir)
await mkdir(out)
await copyFile(resolve(publicFile), join(out, 'public-original.json'))
await copyFile(resolve(localFile), join(out, 'local-original.json'))
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { decode, KEY } = await server.ssrLoadModule('/src/store.ts')
  const load = async path => {
    const input = JSON.parse(await readFile(path, 'utf8'))
    if (input.key !== KEY || typeof input.raw !== 'string' || typeof input.origin !== 'string') {
      throw new Error('Expected backup envelope: key, origin, raw. See docs/data-merge.md')
    }
    return { envelope: input, data: decode(input.raw) }
  }
  const a = await load(publicFile), b = await load(localFile)
  if (a.envelope.origin !== 'https://komiki0401.github.io' || !['http://127.0.0.1:5173', 'http://localhost:5173'].includes(b.envelope.origin)) {
    throw new Error('Origins do not match public/local input order')
  }
  const result = planMerge(a.data, b.data)
  if (!result.conflicts.length) decode(JSON.stringify(result.data))
  await writeFile(join(out, 'report.json'), JSON.stringify({
    sources: [a.envelope.origin, b.envelope.origin],
    conflicts: result.conflicts, summary: result.summary,
    policy: 'ID union; ambiguous changes stop output; no reward/offer functions called',
  }, null, 2), { flag: 'wx' })
  if (result.conflicts.length) {
    console.error(`${result.conflicts.length} conflict(s). No merged.json written. See report.json.`)
    process.exitCode = 2
  } else {
    await writeFile(join(out, 'merged.json'), JSON.stringify(result.data, null, 2), { flag: 'wx' })
    console.log(`Candidate only: ${out}. Review report before importing.`)
  }
} finally {
  await server.close()
}
