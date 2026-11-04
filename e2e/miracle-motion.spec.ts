import { expect, test, type Page } from '@playwright/test'
import { encounterWeights } from '../src/encounters'
import type { AnimatedMiracleId } from '../src/miracleCatalog'

async function encounter(page: Page, kind: AnimatedMiracleId) {
  await page.goto('./')
  await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click()
  await page.evaluate(() => {
    const key = 'yumekana-shrine:v1', data = JSON.parse(localStorage.getItem(key)!)
    data.spirit = { gratitude: 40, expectation: 0 }
    localStorage.setItem(key, JSON.stringify(data))
  })
  const weights = encounterWeights({ gratitude: 40, expectation: 0 })
  const index = weights.findIndex(w => w.kind === kind)
  const roll = weights.slice(0, index).reduce((sum, w) => sum + w.weight, 0) + weights[index].weight / 2
  await page.addInitScript(value => { Math.random = () => value }, roll)
  await page.clock.install()
  await page.reload()
  await page.clock.fastForward(9000)
}

test('龍が空を移動し、風をとめると動きと抽選を停止する', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await encounter(page, 'dragon')
  const journey = page.locator('.visual-dragon-crossing .vector-journey')
  await expect(journey).toBeVisible()
  const changed = await journey.evaluate(el => {
    const animation = el.getAnimations()[0]
    animation.currentTime = 0
    const start = getComputedStyle(el).transform
    animation.currentTime = 7000
    const end = getComputedStyle(el).transform
    return start !== end
  })
  expect(changed).toBe(true)
  await page.getByRole('button', { name: '風をとめる' }).click()
  await expect.poll(() => page.locator('.vector-miracle').evaluate(el => el.getAnimations({ subtree: true }).every(a => ['paused', 'finished'].includes(a.playState)))).toBe(true)
  await page.clock.fastForward(120000)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).encounters.length)).toBe(1)
  await page.getByRole('button', { name: '特別演出を閉じる' }).click()
  await expect(page.locator('.shrine-scene')).not.toHaveAttribute('data-miracle', 'dragon')
})

test('鳥居自体が輝き、閉じると元に戻り、動きを減らす設定では静止する', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await encounter(page, 'glowingTorii')
  await expect(page.locator('.shrine-scene')).toHaveAttribute('data-miracle', 'glowingTorii')
  expect(await page.locator('.shrine-torii').evaluate(el => getComputedStyle(el).filter)).not.toBe('none')
  expect(await page.locator('.vector-miracle').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0)
  // The overlay is decorative; the existing shrine navigation still works.
  await page.getByRole('button', { name: '絵馬殿 ↗', exact: true }).click()
  await expect(page.getByRole('heading', { name: '夢を、絵馬に込めて' })).toBeVisible()
  await page.locator('.bottom-nav:visible,.desktop-nav:visible').getByRole('button', { name: '神社', exact: true }).click()
  await expect(page.locator('.shrine-scene')).not.toHaveAttribute('data-miracle', 'glowingTorii')
})

test('新しいSVGの読み込み失敗でも発見を記録しない', async ({ page }) => {
  await page.route('**/assets/phoenix-*.svg*', route => route.abort())
  const failed = page.waitForEvent('requestfailed', request => /assets\/phoenix-.*\.svg/.test(request.url()))
  await encounter(page, 'phoenix')
  await failed
  await expect(page.locator('.shrine-encounter')).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('yumekana-shrine:v1')!).encounters.length)).toBe(0)
})
