import { describe, expect, it } from 'vitest'
import { addSuggestedDream, decode, empty, fulfillDream, recordEncounter, recordGratitude, registerDream } from './store'
import { encounterWeights, rollEncounter, encounterRate, rarityProbabilities, categoryAffinity, spiritTotal } from './encounters'
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

describe('境内の特別演出',()=>{
 it('発生率は合計値を使い、レアリティとは分離する',()=>{
  expect(spiritTotal({gratitude:12,expectation:8})).toBe(20)
  expect(encounterRate({gratitude:20,expectation:0})).toBe(encounterRate({gratitude:0,expectation:20}))
  expect(encounterRate({gratitude:0,expectation:0})).toBeGreaterThan(0)
  expect(encounterRate({gratitude:10000,expectation:10000})).toBe(.95)
  expect(rollEncounter({gratitude:10000,expectation:10000},()=>.999)).toBeNull()
 })
 it('0からでも実装済みの10種類すべてに出会える',()=>{
  const weights=encounterWeights({gratitude:0,expectation:0})
  expect(weights).toHaveLength(10)
  expect(weights.every(entry=>entry.weight>0)).toBe(true)
  expect(weights.reduce((sum,entry)=>sum+entry.weight,0)).toBeCloseTo(encounterRate({gratitude:0,expectation:0}))
  let start=0
  for(const entry of weights){expect(rollEncounter({gratitude:0,expectation:0},()=>start+entry.weight/2)).toBe(entry.kind);start+=entry.weight}
 })
 it('演出発生時の基本レアリティ割合は50/30/15/4/1',()=>{
  expect(rarityProbabilities({gratitude:0,expectation:0})).toEqual({N:.5,R:.3,SR:.15,SSR:.04,UR:.01})
 })
 it('感謝は動物・自然、期待は空・神秘、両方は神様の傾向を上げる',()=>{
  expect(categoryAffinity('animals',{gratitude:100,expectation:0})).toBeGreaterThan(categoryAffinity('sky',{gratitude:100,expectation:0}))
  expect(categoryAffinity('mystic',{gratitude:0,expectation:100})).toBeGreaterThan(categoryAffinity('nature',{gratitude:0,expectation:100}))
  expect(categoryAffinity('divine',{gratitude:50,expectation:50})).toBeGreaterThan(categoryAffinity('divine',{gratitude:100,expectation:0}))
  expect(rarityProbabilities({gratitude:50,expectation:50}).UR).toBeGreaterThan(rarityProbabilities({gratitude:0,expectation:0}).UR)
  expect(rarityProbabilities({gratitude:50,expectation:50}).UR).toBeGreaterThan(rarityProbabilities({gratitude:100,expectation:0}).UR)
 })
 it('同じ合計でも内訳で関連演出の確率が変わる',()=>{
  const g=encounterWeights({gratitude:50,expectation:0}),e=encounterWeights({gratitude:0,expectation:50})
  expect(g.find(x=>x.kind==='butterfly')!.weight).toBeGreaterThan(e.find(x=>x.kind==='butterfly')!.weight)
  expect(e.find(x=>x.kind==='shootingStar')!.weight).toBeGreaterThan(g.find(x=>x.kind==='shootingStar')!.weight)
 })
 it('出会いを重複なく保存し、感謝度と期待度は消費しない',()=>{
  const d=recordGratitude(registerDream(empty(),dream),thanks)
  const entry={id:'event',kind:'cat' as const,date:thanks.date,createdAt:thanks.createdAt}
  const next=recordEncounter(d,entry)
  expect(next.encounters).toEqual([entry]);expect(next.spirit).toEqual(d.spirit)
  expect(recordEncounter(next,entry)).toBe(next);expect(decode(JSON.stringify(next))).toEqual(next)
 })
})
