import {describe,expect,it} from 'vitest'
import {miracleCatalog,implementedMiracles,isAnimatedMiracle} from './miracleCatalog'
import {firstDiscoveries} from './discoveries'
import {empty,decode,recordEncounter,registerDream,recordGratitude} from './store'
import {encounterWeights,encounterRate,matchesMiracleConditions} from './encounters'
import {encounterImages} from './encounterImages'

describe('奇跡図鑑',()=>{
 it('50種類・5カテゴリ各10・IDと番号が一意',()=>{
  expect(miracleCatalog).toHaveLength(50)
  expect(new Set(miracleCatalog.map(x=>x.id)).size).toBe(50)
  expect(miracleCatalog.map(x=>x.number)).toEqual(Array.from({length:50},(_,i)=>i+1))
  for(const category of ['animals','nature','sky','mystic','divine'])expect(miracleCatalog.filter(x=>x.category===category)).toHaveLength(10)
 })
 it('完成した10種類だけが画像と抽選対象を持つ',()=>{
  expect(implementedMiracles).toHaveLength(10)
  expect(Object.keys(encounterImages).sort()).toEqual(implementedMiracles.map(x=>x.id).sort())
  expect(new Set(implementedMiracles.map(x=>x.rarity)).size).toBe(5)
  for(const spirit of [{gratitude:0,expectation:0},{gratitude:100,expectation:100}]){
   const weights=encounterWeights(spirit)
   expect(weights.every(x=>isAnimatedMiracle(x.kind))).toBe(true)
   expect(weights.reduce((s,x)=>s+x.weight,0)).toBeCloseTo(encounterRate(spirit))
  }
 })
 it('未実装の演出は保存・発見に入れない',()=>{
  const d=empty(),entry={id:'pending',kind:'dragon' as const,date:'2026-11-02',createdAt:'2026-11-02T01:00:00Z'}
  expect(recordEncounter(d,entry)).toBe(d)
  expect(firstDiscoveries([entry]).size).toBe(0)
 })
 it('再発見で初回日時を上書きせず、古いmiracleを引き継ぐ',()=>{
  const first={id:'first',kind:'miracle' as const,date:'2026-11-01',createdAt:'2026-11-01T01:00:00Z'}
  const later={id:'later',kind:'deitySmile' as const,date:'2026-11-02',createdAt:'2026-11-02T01:00:00Z'}
  const discoveries=firstDiscoveries([later,first])
  expect(discoveries.size).toBe(1);expect(discoveries.get('deitySmile')?.createdAt).toBe(first.createdAt)
  const d=empty();d.encounters=[first,later]
  expect(firstDiscoveries(decode(JSON.stringify(d)).encounters).get('deitySmile')?.id).toBe('first')
 })
})

describe('積み重ねを追加し直しで増やさない',()=>{
 it('夢を削除して同じ候補・同じ文章を登録し直しても期待度を増やさない',()=>{
  const dream={id:'a',suggestionId:'happiness-001',title:'美味しいご飯を食べる',detail:'',target:'',createdAt:'2026-11-02',status:'wishing' as const}
  let d=registerDream(empty(),dream)
  d={...d,dreams:[]}
  d=decode(JSON.stringify(d))
  const next=registerDream(d,{...dream,id:'b',title:'美味しい ご飯を食べる。'})
  expect(next.dreams).toHaveLength(1);expect(next.spirit.expectation).toBe(1)
  expect(decode(JSON.stringify(next)).spirit.expectation).toBe(1)
 })
 it('同日の同じ感謝は再追加しても増えず、翌日の感謝は蓄積できる',()=>{
  const entry={id:'a',text:'今日もありがとう',date:'2026-11-02',createdAt:'2026-11-02T01:00:00Z'}
  let d=recordGratitude(empty(),entry);d={...d,gratitudes:[]};d=decode(JSON.stringify(d))
  d=recordGratitude(d,{...entry,id:'b'})
  expect(d.spirit.gratitude).toBe(1)
  expect(decode(JSON.stringify(d)).spirit.gratitude).toBe(1)
  expect(recordGratitude(d,{...entry,id:'c',date:'2026-11-03'}).spirit.gratitude).toBe(2)
 })
})


it('将来の季節・時間帯条件を評価できる（現在の50種に限定条件なし）',()=>{
 expect(matchesMiracleConditions({season:'spring',time:'day'},new Date(2026,3,1,12))).toBe(true)
 expect(matchesMiracleConditions({season:'winter'},new Date(2026,3,1,12))).toBe(false)
 expect(matchesMiracleConditions({time:'night'},new Date(2026,3,1,22))).toBe(true)
 expect(miracleCatalog.every(item=>!('conditions' in item))).toBe(true)
})
