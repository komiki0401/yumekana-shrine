import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('yumekana-shrine:v1', JSON.stringify({version:1,dreams:[],dailyGoals:{},transactions:[],fortunes:{},settings:{id:'motion-test',sound:false,welcomed:true},gratitudes:[],encounters:[],spirit:{gratitude:0,expectation:0},spiritCredits:{dreams:[],gratitudes:[],gratitudeDays:{}}}))
  })
  await page.goto('./')
  const nav = page.viewportSize()!.width <= 760 ? 'モバイルナビゲーション' : 'メインナビゲーション'
  await page.getByRole('navigation',{name:nav,exact:true}).getByRole('button',{name:'お礼参り',exact:true}).click()
})

test('光る選択肢が下へ移動し、選択だけでは保存や加点を行わない', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'})
  const before = await page.evaluate(() => localStorage.getItem('yumekana-shrine:v1'))
  const choices = page.getByRole('group',{name:'今日、ちょっと幸せだったことは？'}).getByRole('checkbox')
  await choices.nth(0).check()
  await expect(page.locator('.gratitude-choice-flight')).toHaveCount(1)
  const travel = await page.locator('.gratitude-choice-flight').evaluate(el => {
    const frames = (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes()
    return {first:frames[0].transform,last:frames[frames.length-1].transform}
  })
  expect(travel.last).not.toBe(travel.first)
  await choices.nth(1).check()
  await expect(page.locator('.gratitude-selected-sentences > div')).toHaveCount(2)
  await expect(page.locator('.gratitude-choice-flight')).toHaveCount(0,{timeout:3000})
  await choices.nth(0).uncheck()
  await expect(page.locator('.gratitude-selected-sentences > div')).toHaveCount(1)
  expect(await page.evaluate(() => localStorage.getItem('yumekana-shrine:v1'))).toBe(before)
})

test('動きを減らす設定ではアニメーションなしで選択に反映する', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.getByRole('group',{name:'今日、ちょっと幸せだったことは？'}).getByRole('checkbox').first().check()
  await expect(page.locator('.gratitude-choice-flight')).toHaveCount(0)
  await expect(page.locator('.gratitude-selected-sentences > div')).toHaveCount(1)
})
