import { describe, expect, it } from 'vitest'
import { balance, decode, draw, empty, localDate, offer, toggleGoal, fulfillDream } from './store'
const date='2026-11-02'
function setup(){const d=empty();d.dailyGoals[date]=[{id:'goal-1',title:'散歩',done:false}];return d}
describe('小判の取引',()=>{
 it('達成、取消、再達成で純報酬が1枚になる',()=>{let d=setup();d=toggleGoal(d,date,'goal-1');expect(balance(d)).toBe(1);d=toggleGoal(d,date,'goal-1');expect(balance(d)).toBe(0);d=toggleGoal(d,date,'goal-1');expect(balance(d)).toBe(1);expect(d.transactions.map(t=>t.kind)).toEqual(['earn','undo','earn'])})
 it('奉納済み報酬の取消と残高ゼロでの奉納を止める',()=>{const d=offer(toggleGoal(setup(),date,'goal-1'),date);expect(balance(d)).toBe(0);expect(()=>toggleGoal(d,date,'goal-1')).toThrow('奉納済み');expect(()=>offer(d,date)).toThrow();expect(d.dailyGoals[date][0].done).toBe(true)})
 it('別の日の目標と取引を保持する',()=>{const d=toggleGoal(setup(),date,'goal-1');expect(d.dailyGoals['2026-11-03']).toBeUndefined();expect(toggleGoal(d,'2026-11-03','goal-1')).toBe(d);expect(balance(d)).toBe(1)})
})
describe('おみくじと日付',()=>{
 it('同じ日は同じ結果、翌日は独立して抽選する',()=>{const d=draw(empty(),date);expect(draw(d,date)).toBe(d);const next=draw(d,'2026-11-03');expect(Object.keys(next.fortunes)).toHaveLength(2);expect(next.fortunes[date]).toEqual(d.fortunes[date]);expect(next.fortunes[date].id).not.toEqual(next.fortunes['2026-11-03'].id)})
 it('ローカル日付で月と年をまたげる',()=>{expect(localDate(new Date(2026,11,31,23,59))).toBe('2026-12-31');expect(localDate(new Date(2027,0,1,0,0))).toBe('2027-01-01')})
})
describe('保存データ',()=>{
 it('目標、取引、おみくじを往復できる',()=>{const d=draw(toggleGoal(setup(),date,'goal-1'),date);expect(decode(JSON.stringify(d))).toEqual(d)})
 it('不正なJSONと構造と負の残高を拒否する',()=>{expect(()=>decode('{bad')).toThrow();expect(()=>decode('{"version":1}')).toThrow();const d=setup();d.transactions=[{id:'bad',date,amount:-1,kind:'offer'}];expect(()=>decode(JSON.stringify(d))).toThrow()})
})


describe('夢の達成報酬', () => {
 it('初回の夢達成だけに小判を付与し同じ夢では重複しない', () => {
  const d = empty()
  d.dreams = [{ id: 'dream-1', title: '美味しいご飯', detail: '', target: '', createdAt: date, status: 'wishing' }]
  const next = fulfillDream(d, 'dream-1', date, '幸せでした')
  expect(next.dreams[0]).toMatchObject({ status: 'fulfilled', message: '幸せでした', achievedAt: date })
  expect(balance(next)).toBe(1)
  expect(fulfillDream(next, 'dream-1', date, '')).toBe(next)
  expect(fulfillDream(next, 'missing', date, '')).toBe(next)
  expect(balance(offer(next, date))).toBe(0)
  expect(decode(JSON.stringify(next))).toEqual(next)
 })
})
