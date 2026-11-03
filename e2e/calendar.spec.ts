import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-03T03:00:00Z') })
  await page.addInitScript(() => {
    const data = { version:1, dreams:[{id:'protected-dream',title:'大切な夢',detail:'変更しない',createdAt:'2026-10-01',target:'',status:'wishing'}],
      dailyGoals:{}, transactions:[{id:'protected-coin',date:'2026-10-01',kind:'earn',amount:1}],fortunes:{},
      settings:{id:'protected-device',sound:false,welcomed:true},gratitudes:[],encounters:[],
      spirit:{gratitude:0,expectation:1},spiritCredits:{dreams:['title:大切な夢'],gratitudes:[],gratitudeDays:{}} }
    const raw = JSON.stringify(data)
    localStorage.setItem('yumekana-shrine:v1', raw)
    ;(window as unknown as { originalStorage: string }).originalStorage = raw
  })
  await page.goto('./')
})
const openCalendar = async (page: import('@playwright/test').Page) => {
  const nav = page.viewportSize()!.width <= 760 ? 'モバイルナビゲーション' : 'メインナビゲーション'
  await page.getByRole('navigation',{name:nav,exact:true}).getByRole('button',{name:'開運暦',exact:true}).click()
  await expect(page.getByRole('heading',{name:'暦と星の、開運暦'})).toBeVisible()
}
test('開運暦の月移動・日付詳細・今日に戻ると既存おみくじを確認', async ({ page }) => {
  await openCalendar(page)
  await expect(page.getByRole('button',{name:/2026-11-03 今日/})).toHaveAttribute('aria-current','date')
  await page.getByRole('button',{name:/2026-11-09 /}).click()
  const detail = page.getByRole('article',{name:'選んだ日の詳細'})
  await expect(detail.getByText('新月', {exact:false}).first()).toBeVisible()
  await expect(detail.getByText('16:02 JST頃')).toBeVisible()
  await page.getByRole('button',{name:'次の月',exact:true}).click()
  await expect(page.getByRole('group',{name:'2026年12月の日付'})).toBeVisible()
  await page.getByRole('button',{name:'今日に戻る',exact:true}).click()
  await expect(page.getByRole('button',{name:/2026-11-03 今日/})).toHaveAttribute('aria-pressed','true')
  const nav = page.viewportSize()!.width <= 760 ? 'モバイルナビゲーション' : 'メインナビゲーション'
  await page.getByRole('navigation',{name:nav,exact:true}).getByRole('button',{name:'おみくじ',exact:true}).click()
  await expect(page.getByRole('heading',{name:'今日の、おみくじ'})).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('yumekana-shrine:v1') === (window as unknown as { originalStorage:string }).originalStorage)).toBe(true)
})
test('スマホ320pxで横にはみ出さず、対応外は未取得と表示', async ({ page }) => {
  await page.setViewportSize({width:320,height:740})
  await openCalendar(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  for (let i=0;i<14;i++) await page.getByRole('button',{name:'次の月',exact:true}).click()
  await expect(page.getByRole('group',{name:'2028年1月の日付'})).toBeVisible()
  await expect(page.getByText('未取得：試験対応は2025〜2027年です')).toBeVisible()
  await page.getByRole('button',{name:'今日に戻る',exact:true}).click()
  await page.screenshot({path:`.local-backups/calendar-${test.info().project.name}.png`,fullPage:true})
  expect(await page.evaluate(() => localStorage.getItem('yumekana-shrine:v1') === (window as unknown as { originalStorage:string }).originalStorage)).toBe(true)
})
