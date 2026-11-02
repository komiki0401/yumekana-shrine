import { describe, expect, it } from 'vitest'
import { addSuggestedDream, decode, empty, fulfillDream, recordEncounter, recordGratitude, registerDream } from './store'
import { encounterWeights, rollEncounter, encounterThresholds, spiritTotal } from './encounters'
import { dreamGenres } from './dreamCatalog'

const dream = { id: 'dream', title: '美味しいご飯', detail: '', target: '', createdAt: '2026-11-02', status: 'wishing' as const }
const thanks = { id: 'thanks', text: '  今日もありがとう  ', date: '2026-11-02', createdAt: '2026-11-02T12:00:00.000Z' }

describe('お礼参りと期待度', () => {
 it('旧v1データの記録と小判を保って追加フィールドを移行する', () => {
  const { gratitudes, spirit, encounters, ...legacy } = empty()
  void gratitudes; void spirit; void encounters
  legacy.dreams = [dream]
  legacy.transactions = [{ id: 'coin', date: '2026-11-01', amount: 1, kind: 'earn' }]
  const migrated = decode(JSON.stringify(legacy))
  expect(migrated.dreams).toEqual(legacy.dreams)
  expect(migrated.transactions).toEqual(legacy.transactions)
  expect(migrated.settings).toEqual(legacy.settings)
  expect(migrated.gratitudes).toEqual([])
  expect(migrated.spirit).toEqual({ gratitude: 0, expectation: 1 })
  expect(decode(JSON.stringify(migrated))).toEqual(migrated)
 })
 it('感謝は任意の日に複数残せて一意の記録ごとに蓄積する', () => {
  const d = recordGratitude(empty(), thanks)
  expect(d.gratitudes[0].text).toBe('今日もありがとう')
  expect(d.spirit.gratitude).toBe(1)
  expect(recordGratitude(d, thanks)).toBe(d)
  const next = recordGratitude(d, { ...thanks, id: 'thanks-2', date: '2027-01-01' })
  expect(next.spirit).toEqual({ gratitude: 2, expectation: 0 })
  expect(decode(JSON.stringify(next))).toEqual(next)
 })
 it('空の感謝と長すぎる記録、未達成の夢への紐づけを拒否する', () => {
  expect(() => recordGratitude(empty(), { ...thanks, text: '  ' })).toThrow()
  expect(() => recordGratitude(empty(), { ...thanks, text: 'あ'.repeat(1001) })).toThrow()
  const d = registerDream(empty(), dream)
  expect(() => recordGratitude(d, { ...thanks, dreamId: dream.id })).toThrow()
  const fulfilled = fulfillDream(d, dream.id, thanks.date, '')
  expect(recordGratitude(fulfilled, { ...thanks, dreamId: dream.id }).gratitudes[0].dreamId).toBe(dream.id)
 })
 it('手書きと候補の新規登録で期待度が増え、編集・達成・重複では増減しない', () => {
  const d = registerDream(empty(), dream)
  expect(d.spirit.expectation).toBe(1)
  expect(registerDream(d, dream)).toBe(d)
  const next = addSuggestedDream(d, dreamGenres[1].suggestions[0], thanks.date)
  expect(next.spirit.expectation).toBe(2)
  expect(addSuggestedDream(next, dreamGenres[1].suggestions[0], thanks.date)).toBe(next)
  expect(fulfillDream(next, dream.id, thanks.date, '').spirit).toEqual(next.spirit)
 })
 it('不正な追加データを破損として検出する', () => {
  expect(() => decode(JSON.stringify({ ...empty(), spirit: { gratitude: -1, expectation: 0 } }))).toThrow()
  expect(() => decode(JSON.stringify({ ...empty(), gratitudes: [{}] }))).toThrow()
  expect(() => decode(JSON.stringify({ ...empty(), encounters: [{}] }))).toThrow()
 })
})

describe('境内の特別演出', () => {
 it('同じ合計なら感謝と期待の内訳に関係なく同じ抽選になる', () => {
  expect(spiritTotal({gratitude:12,expectation:8})).toBe(20)
  expect(encounterWeights({gratitude:20,expectation:0})).toEqual(encounterWeights({gratitude:0,expectation:20}))
  expect(encounterWeights({gratitude:12,expectation:8})).toEqual(encounterWeights({gratitude:20,expectation:0}))
 })
 it('合計の閾値でそれぞれの演出を解放する', () => {
  for (const [kind, threshold] of Object.entries(encounterThresholds)) {
   expect(encounterWeights({gratitude:0,expectation:threshold-1}).find(entry=>entry.kind===kind)?.weight).toBe(0)
   expect(encounterWeights({gratitude:threshold,expectation:0}).find(entry=>entry.kind===kind)?.weight).toBeGreaterThan(0)
  }
  expect(rollEncounter({gratitude:0,expectation:0},()=>0)).toBeNull()
  expect(rollEncounter({gratitude:0,expectation:1},()=>0)).toBe('cat')
  expect(rollEncounter({gratitude:8,expectation:0},()=>0)).toBe('deity')
 })
 it('上限に届くまでは基準確率を正確に3倍にする', () => {
  const one = encounterWeights({gratitude:0,expectation:1})
  expect(one.find(entry=>entry.kind==='cat')?.weight).toBeCloseTo((.04 + .006) * 3)
  const five = encounterWeights({gratitude:2,expectation:3})
  expect(five.find(entry=>entry.kind==='cat')?.weight).toBeCloseTo((.04 + 5*.006) * 3)
  for (const kind of ['blossoms','butterfly','shootingStar']) {
   expect(five.find(entry=>entry.kind===kind)?.weight).toBeCloseTo((.025 + 5*.002) * 3)
  }
 })
 it('高い合計でも全体95%を上限とし、レア度の比率を保つ', () => {
  const high = encounterWeights({gratitude:10000,expectation:10000})
  expect(high.reduce((sum,entry)=>sum+entry.weight,0)).toBeCloseTo(.95)
  const cat = high.find(entry=>entry.kind==='cat')!.weight
  const miracle = high.find(entry=>entry.kind==='miracle')!.weight
  expect(cat / miracle).toBeCloseTo(.24 / .012)
  expect(rollEncounter({gratitude:10000,expectation:10000},()=>.999)).toBeNull()
  let previous = 0
  for (let total=0;total<=200;total++) {
   const rate = encounterWeights({gratitude:total,expectation:0}).reduce((sum,entry)=>sum+entry.weight,0)
   expect(rate).toBeGreaterThanOrEqual(previous - 1e-12)
   expect(rate).toBeLessThanOrEqual(.95 + 1e-12)
   previous = rate
  }
 })
 it('超レアは合計40以上なら、片方の数値が0でも候補に入る', () => {
  expect(encounterWeights({gratitude:39,expectation:0}).find(entry=>entry.kind==='miracle')?.weight).toBe(0)
  expect(rollEncounter({gratitude:40,expectation:0},()=>0)).toBe('miracle')
  expect(rollEncounter({gratitude:0,expectation:40},()=>0)).toBe('miracle')
 })
 it('出会いを重複なく保存し、感謝度と期待度は消費しない', () => {
  const d = recordGratitude(registerDream(empty(), dream), thanks)
  const entry = { id: 'event', kind: 'cat' as const, date: thanks.date, createdAt: thanks.createdAt }
  const next = recordEncounter(d, entry)
  expect(next.encounters).toEqual([entry])
  expect(next.spirit).toEqual(d.spirit)
  expect(recordEncounter(next, entry)).toBe(next)
  expect(decode(JSON.stringify(next))).toEqual(next)
 })
})
