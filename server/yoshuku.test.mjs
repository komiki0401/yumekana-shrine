import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { configFromEnv, FileQuota, makeHandler, validateRequest } from './yoshuku.mjs'

const turn = { question: 'どんな気持ちでしたか？', answer: '安心した' }
const origin = 'http://localhost:5173'
async function withServer(options, fn) {
  const server = createServer(makeHandler({ origins: [origin], ...options }))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}/api/yoshuku`
  const post = (body, extra = {}) => fetch(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...extra }, body: typeof body === 'string' ? body : JSON.stringify(body) })
  try { await fn(post) } finally { await new Promise(resolve => server.close(resolve)) }
}
test('AI is disabled by default and missing credentials cannot enable it', async () => {
  assert.equal(configFromEnv({}).enabled, false)
  assert.throws(() => configFromEnv({ YOSHUKU_AI_ENABLED: 'true' }))
  await withServer({}, async post => assert.equal((await post({})).status, 503))
})
test('request shape, minimum data, and four-answer boundary are validated', () => {
  const input = { action: 'next', wish: '海を見る', turns: [turn], unrelatedHistory: ['secret'] }
  assert.deepEqual(Object.keys(validateRequest(input)).sort(), ['action', 'turns', 'wish'])
  assert.throws(() => validateRequest({ ...input, wish: 'a'.repeat(81) }))
  assert.throws(() => validateRequest({ ...input, action: 'summary' }))
  assert.throws(() => validateRequest({ ...input, turns: Array(4).fill(turn) }))
})
test('quota survives restart, resets the next day, stores no clear IP and fails closed on corruption', () => {
  const dir = mkdtempSync(join(tmpdir(), 'yoshuku-'))
  const path = join(dir, 'quota.json'), secret = 'test'.repeat(8)
  try {
    const today = new Date('2026-11-03T00:00:00Z')
    new FileQuota(path, secret, 2, 1).reserve('192.0.2.1', today)
    assert.throws(() => new FileQuota(path, secret, 2, 1).reserve('192.0.2.1', today), /上限/)
    new FileQuota(path, secret, 2, 1).reserve('192.0.2.2', today)
    assert.throws(() => new FileQuota(path, secret, 2, 1).reserve('192.0.2.3', today), /上限/)
    assert.ok(!readFileSync(path, 'utf8').includes('192.0.2.'))
    new FileQuota(path, secret, 2, 1).reserve('192.0.2.1', new Date('2026-11-04T00:00:00Z'))
    writeFileSync(path, '{bad')
    assert.throws(() => new FileQuota(path, secret).reserve('ip'), /安全のため停止/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
test('CORS, input and size errors never call the provider; initial emotion wording is fixed', async () => {
  let calls = 0
  await withServer({ enabled: true, apiKey: 'server-only', model: 'test', quota: { reserve() {} }, fetchImpl: async () => { calls++; throw Error('should not call') } }, async post => {
    assert.equal((await post({}, { Origin: 'https://untrusted.test' })).status, 403)
    assert.equal((await post('{bad')).status, 400)
    assert.equal((await post({ action: 'next', wish: 'a'.repeat(23000), turns: [turn] })).status, 413)
    const response = await post({ action: 'rephrase', wish: '海を見る', turns: [] })
    assert.match((await response.json()).text, /気持ち/)
    assert.equal(calls, 0)
  })
})
test('only server attaches API key; bounded generation, retry failures, and quota are enforced', async () => {
  let calls = 0, reserved = 0
  await withServer({ enabled: true, apiKey: 'server-only', model: 'test', quota: { reserve() { if (++reserved > 3) throw Object.assign(Error('上限'), { status: 429 }) } }, fetchImpl: async (url, options) => {
    calls++
    assert.equal(url, 'https://api.openai.com/v1/chat/completions')
    assert.equal(options.headers.Authorization, 'Bearer server-only')
    const body = JSON.parse(options.body)
    assert.equal(body.max_completion_tokens, 512)
    const text = calls === 1 ? 'どんな景色が見えていましたか？' : calls === 2 ? '何をしましたか？誰といましたか？' : undefined
    if (!text) return new Response('provider error', { status: 503 })
    return Response.json({ choices: [{ message: { content: JSON.stringify({ text }) } }] })
  } }, async post => {
    const input = { action: 'next', wish: '海を見る', turns: [turn] }
    const response = await post(input)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { mode: 'ai', text: 'どんな景色が見えていましたか？' })
    assert.equal((await post(input)).status, 502)
    assert.equal((await post(input)).status, 502)
    assert.equal((await post(input)).status, 429)
    assert.equal(calls, 3)
  })
})
