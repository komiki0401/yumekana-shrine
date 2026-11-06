import { describe, expect, it } from 'vitest'
import { getShrineGrowth } from './shrineGrowth'
import { decode, empty, recordGratitude, registerDream } from './store'

describe('感謝と期待で育つ3段階の境内', () => {
  it('合計0・15・50の境界で外観を変え、内訳は問わない', () => {
    for (const [total, level] of [[0, 1], [14, 1], [15, 2], [49, 2], [50, 3], [1000, 3]]) {
      expect(getShrineGrowth({ gratitude: total, expectation: 0 }).stage.level).toBe(level)
      expect(getShrineGrowth({ gratitude: 0, expectation: total }).stage.level).toBe(level)
    }
    expect(getShrineGrowth({ gratitude: 22, expectation: 28 }).stage.level).toBe(3)
  })
  it('次の彩りまでの必要数・進行度を表示し、最終段階に追加の目標を要求しない', () => {
    expect(getShrineGrowth({ gratitude: 5, expectation: 5 })).toMatchObject({ total: 10, remaining: 5, progress: 10 / 15 })
    expect(getShrineGrowth({ gratitude: 15, expectation: 0 })).toMatchObject({ remaining: 35, progress: 0 })
    expect(getShrineGrowth({ gratitude: 25, expectation: 25 })).toMatchObject({ remaining: 0, progress: 1, next: undefined })
  })
  it('既存データの合計から復元し、夢や小判・発見記録を書き換えない', () => {
    const data = empty()
    data.spirit = { gratitude: 32, expectation: 19 }
    data.transactions = [{ id: 'coin', amount: 1, kind: 'earn', date: '2026-11-01' }]
    const restored = decode(JSON.stringify(data)), before = JSON.stringify(restored)
    expect(getShrineGrowth(restored.spirit).stage.level).toBe(3)
    expect(JSON.stringify(restored)).toBe(before)
    expect(restored.transactions).toEqual(data.transactions)
    expect('shrineLevel' in restored).toBe(false)
  })
  it('既存の夢・感謝の処理で段階が上がり、同じ送信や夢の再登録では水増ししない', () => {
    let data = empty(); data.spirit = { gratitude: 13, expectation: 0 }
    const dream = { id: 'dream', title: '海を眺める', detail: '', target: '', createdAt: '2026-11-06', status: 'wishing' as const }
    data = registerDream(data, dream)
    expect(getShrineGrowth(data.spirit).stage.level).toBe(1)
    const thanks = { id: 'thanks', text: '今日もありがとう', date: '2026-11-06', createdAt: '2026-11-06T00:00:00Z' }
    data = recordGratitude(data, thanks)
    expect(getShrineGrowth(data.spirit).stage.level).toBe(2)
    expect(recordGratitude(data, thanks)).toBe(data)
    data = registerDream({ ...data, dreams: [] }, { ...dream, id: 'again' })
    expect(getShrineGrowth(data.spirit).total).toBe(15)
  })
})
