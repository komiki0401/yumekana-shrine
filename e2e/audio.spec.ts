import { expect, test, type Page } from '@playwright/test'

type Probe = { contexts: AudioContext[]; sources: AudioBufferSourceNode[]; active: Set<AudioBufferSourceNode>; gains: GainNode[]; oscillators: number }
type AudioWindow = Window & { probe: Probe }
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext
    const probe: Probe = { contexts: [], sources: [], active: new Set(), gains: [], oscillators: 0 }
    ;(window as AudioWindow).probe = probe
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) { super(options); probe.contexts.push(this) }
      createBufferSource() {
        const source = super.createBufferSource(), start = source.start.bind(source)
        probe.sources.push(source)
        source.start = (...args) => { probe.active.add(source); start(...args) }
        source.addEventListener('ended', () => probe.active.delete(source))
        return source
      }
      createGain() { const gain = super.createGain(); probe.gains.push(gain); return gain }
      createOscillator() { probe.oscillators++; return super.createOscillator() }
    }
  })
})
async function enter(page: Page) {
  await page.goto('./')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
}
const playing = (page: Page) => expect(page.locator('.home-audio')).toHaveAttribute('data-audio-state', 'playing')

test('初期OFFは音源を読まず、ユーザー操作後に実音源をループ再生・停止する', async ({ page }) => {
  let requests = 0
  page.on('request', r => { if (r.url().includes('komorebi-no-negai.mp3')) requests++ })
  await enter(page)
  await expect(page.getByRole('button', { name: 'BGMを聴く', exact: true })).toBeVisible()
  expect(requests).toBe(0)
  expect(await page.evaluate(() => (window as AudioWindow).probe.contexts.length)).toBe(0)
  await page.getByRole('button', { name: 'BGMを聴く', exact: true }).click()
  await playing(page)
  const audio = await page.evaluate(() => {
    const p = (window as AudioWindow).probe, source = p.sources[0], samples = source.buffer!.getChannelData(0)
    let energy = 0
    for (let i = 0; i < samples.length; i += 113) energy += samples[i] ** 2
    return { state: p.contexts[0].state, loop: source.loop, end: source.loopEnd, duration: source.buffer!.duration, energy, count: p.active.size }
  })
  expect(audio.state).toBe('running'); expect(audio.loop).toBe(true); expect(audio.end).toBeCloseTo(96, 1)
  expect(audio.duration).toBeGreaterThan(95); expect(audio.energy).toBeGreaterThan(1); expect(audio.count).toBe(1)
  expect(requests).toBe(1)
  await page.getByRole('button', { name: 'BGMを止める', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as AudioWindow).probe.active.size)).toBe(0)
  await expect.poll(() => page.evaluate(() => (window as AudioWindow).probe.contexts[0].state)).toBe('suspended')
})

test('BGMと効果音の独立設定、音量保存、ページ移動と再読み込み後の再開', async ({ page }) => {
  await enter(page)
  await page.getByRole('button', { name: 'BGMを聴く', exact: true }).click(); await playing(page)
  await page.getByRole('button', { name: '音の設定', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'BGMを有効にする' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '効果音を有効にする' })).not.toBeChecked()
  await page.getByRole('slider', { name: 'BGMの音量', exact: true }).focus()
  await page.getByRole('slider', { name: 'BGMの音量', exact: true }).press('Home')
  await page.getByRole('slider', { name: 'BGMの音量', exact: true }).press('ArrowRight')
  await page.getByRole('checkbox', { name: '効果音を有効にする' }).check()
  await page.getByRole('button', { name: '効果音を試聴', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as AudioWindow).probe.oscillators)).toBe(3)
  await page.getByRole('slider', { name: '効果音の音量', exact: true }).press('End')
  const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).settings)
  expect(settings.bgmVolume).toBe(.01); expect(settings.soundVolume).toBe(1); expect(settings.bgmEnabled).toBe(true)
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  const nav = page.locator(await page.locator('.bottom-nav').isVisible() ? '.bottom-nav' : '.desktop-nav')
  await nav.getByRole('button', { name: '絵馬殿', exact: true }).click()
  expect(await page.evaluate(() => (window as AudioWindow).probe.sources.length)).toBe(1)
  await page.reload()
  await expect(page.getByRole('button', { name: 'BGMを再開', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as AudioWindow).probe.contexts.length)).toBe(0)
  await page.getByRole('button', { name: 'BGMを再開', exact: true }).click(); await playing(page)
  await page.getByRole('button', { name: '音の設定', exact: true }).click()
  await expect(page.getByRole('slider', { name: 'BGMの音量', exact: true })).toHaveValue('1')
  await expect(page.getByRole('slider', { name: '効果音の音量', exact: true })).toHaveValue('100')
})

test('非表示で音源を停止し、復帰時には二重再生せず途中から再開する', async ({ page }) => {
  let requests = 0
  page.on('request', r => { if (r.url().includes('komorebi-no-negai.mp3')) requests++ })
  await enter(page)
  await page.getByRole('button', { name: 'BGMを聴く', exact: true }).click(); await playing(page)
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect(page.locator('.home-audio')).toHaveAttribute('data-audio-state', 'paused')
  await expect.poll(() => page.evaluate(() => (window as AudioWindow).probe.contexts[0].state)).toBe('suspended')
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')) })
  await playing(page)
  await expect.poll(() => page.evaluate(() => (window as AudioWindow).probe.active.size)).toBe(1)
  expect(requests).toBe(1)
})

test('読み込み失敗は再試行でき、停止と再生の連打で古い音源が鳴らない', async ({ page }) => {
  let requests = 0
  await page.route('**/audio/komorebi-no-negai.mp3', async route => { requests++; if (requests === 1) await route.fulfill({ status: 503, body: '' }); else await route.continue() })
  await enter(page)
  await page.getByRole('button', { name: 'BGMを聴く', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('BGMを読み込めませんでした')
  await page.getByRole('button', { name: 'BGMを再試行', exact: true }).click(); await playing(page)
  await page.getByRole('button', { name: 'BGMを止める', exact: true }).click()
  await page.getByRole('button', { name: 'BGMを聴く', exact: true }).click(); await playing(page)
  await expect.poll(() => page.evaluate(() => (window as AudioWindow).probe.active.size)).toBe(1)
  expect(requests).toBe(2)
})

test('読み込み途中でOFFにすれば、その後に勝手に鳴らない', async ({ page }) => {
  let release: (() => void) | undefined
  await page.route('**/audio/komorebi-no-negai.mp3', async route => { await new Promise<void>(resolve => { release = resolve }); try { await route.continue() } catch { /* Request was cancelled by OFF. */ } })
  await enter(page)
  await page.getByRole('button', { name: 'BGMを聴く', exact: true }).click()
  await expect.poll(() => !!release).toBe(true)
  await page.getByRole('button', { name: '読み込みをやめる', exact: true }).click(); release!()
  await expect(page.locator('.home-audio')).toHaveAttribute('data-audio-state', 'off')
  expect(await page.evaluate(() => (window as AudioWindow).probe.sources.length)).toBe(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).settings.bgmEnabled)).toBe(false)
})
