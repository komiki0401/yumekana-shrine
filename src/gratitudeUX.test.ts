import {describe,expect,it} from 'vitest'
import {gratitudeChoices,composeGratitude} from './gratitudeChoices'
import {decode,empty,recordGratitude,dailyGratitudePoints,localDate} from './store'
import type {Gratitude} from './store'
const date='2026-11-02'
function entry(id:string,other:Partial<Gratitude>={}):Gratitude{return {id,text:'',date,createdAt:'2026-11-02T12:00:00.000Z',...other}}

describe('100種類のありがとう',()=>{
 it('一意な100個の選択肢と自然な感謝の文章を持つ',()=>{
  expect(gratitudeChoices).toHaveLength(100)
  expect(new Set(gratitudeChoices.map(x=>x.id)).size).toBe(100)
  expect(new Set(gratitudeChoices.map(x=>x.label)).size).toBe(100)
  expect(gratitudeChoices.every(x=>x.sentence.endsWith('ありがとう。'))).toBe(true)
 })
 it('選択した文章と自分の言葉を組み合わせる',()=>{
  expect(composeGratitude(gratitudeChoices.slice(0,2),'  心があたたまった  ')).toBe(gratitudeChoices[0].sentence+'\n'+gratitudeChoices[1].sentence+'\n\n心があたたまった')
 })
 it('選択だけ・自由記述だけ・両方のどれでも1ポイント',()=>{
  for(const input of [{selectedThanks:gratitudeChoices.slice(0,2),freeText:''},{selectedThanks:[],freeText:'自分の言葉'},{selectedThanks:gratitudeChoices.slice(0,3),freeText:'自分の言葉'}]){
   const d=recordGratitude(empty(),entry('a',input))
   expect(d.spirit.gratitude).toBe(1)
   expect(d.gratitudes[0].pointsAwarded).toBe(1)
   expect(d.gratitudes[0].selectedThanks).toEqual(input.selectedThanks)
   expect(d.gratitudes[0].freeText).toBe(input.freeText)
   expect(decode(JSON.stringify(d))).toEqual(d)
  }
 })
 it('空の奉納や不正な候補を拒否する',()=>{
  expect(()=>recordGratitude(empty(),entry('a',{selectedThanks:[],freeText:'  '}))).toThrow()
  expect(()=>recordGratitude(empty(),entry('a',{selectedThanks:[{id:'missing',label:'?',sentence:'?'}],freeText:''}))).toThrow()
 })
 it('同じ選択肢の重複と保存文字列の書き換えを防ぐ',()=>{
  const choice=gratitudeChoices[0]
  const d=recordGratitude(empty(),entry('a',{text:'別の文章',selectedThanks:[choice,{...choice,sentence:'改変'}],freeText:''}))
  expect(d.gratitudes[0].selectedThanks).toHaveLength(1)
  expect(d.gratitudes[0].text).toBe(choice.sentence)
 })
 it('選択数・文章の長さでは加点しない',()=>{
  const d=recordGratitude(empty(),entry('a',{selectedThanks:gratitudeChoices,freeText:'あ'.repeat(1000)}))
  expect(d.gratitudes[0].selectedThanks).toHaveLength(100)
  expect(d.spirit.gratitude).toBe(1)
  expect(d.gratitudes[0].text.length).toBeGreaterThan(1000)
 })
})

describe('1日3ポイント・何度でも奉納',()=>{
 it('同じ内容でも新しい奉納は1回と数え、4回目以降は記録だけ残す',()=>{
  let d=empty()
  for(let i=0;i<6;i++)d=recordGratitude(d,entry('entry-'+i,{selectedThanks:[gratitudeChoices[0]],freeText:''}))
  expect(d.gratitudes).toHaveLength(6)
  expect(d.spirit.gratitude).toBe(3)
  expect(d.gratitudes.map(x=>x.pointsAwarded)).toEqual([1,1,1,0,0,0])
  expect(dailyGratitudePoints(d,date)).toBe(3)
  expect(decode(JSON.stringify(d))).toEqual(d)
 })
 it('同じ送信IDは二重保存も二重加算もしない',()=>{
  const input=entry('a',{freeText:'ありがとう'})
  const d=recordGratitude(empty(),input)
  expect(recordGratitude(d,input)).toBe(d)
  const without={...d,gratitudes:[]}
  expect(recordGratitude(without,input)).toBe(without)
 })
 it('履歴の削除・読み直しで日次上限をリセットしない',()=>{
  let d=empty()
  for(let i=0;i<3;i++)d=recordGratitude(d,entry(String(i),{freeText:'ありがとう'}))
  d=decode(JSON.stringify({...d,gratitudes:[]}))
  const next=recordGratitude(d,entry('after',{freeText:'もう一度'}))
  expect(next.spirit.gratitude).toBe(3)
  expect(next.gratitudes).toHaveLength(1)
  expect(next.gratitudes[0].pointsAwarded).toBe(0)
 })
 it('ローカルの日付が変われば新しい1ポイントを得られる',()=>{
  const before=localDate(new Date(2026,10,2,23,59)),after=localDate(new Date(2026,10,3,0,0))
  let d=empty()
  for(let i=0;i<3;i++)d=recordGratitude(d,entry(String(i),{date:before,freeText:'ありがとう'}))
  const next=recordGratitude(d,entry('next-day',{date:after,freeText:'ありがとう'}))
  expect(next.spirit.gratitude).toBe(4)
  expect(dailyGratitudePoints(next,before)).toBe(3)
  expect(dailyGratitudePoints(next,after)).toBe(1)
 })
 it('旧データの履歴と数値を減らさず、当日の既存記録から上限を補完する',()=>{
  const raw=JSON.parse(JSON.stringify(empty()))
  delete raw.spiritCredits.gratitudeDays
  raw.gratitudes=Array.from({length:5},(_,i)=>entry('old-'+i,{text:'以前の感謝 '+i}))
  raw.spirit.gratitude=5
  raw.spiritCredits.gratitudes=raw.gratitudes.map((x:Gratitude)=>`${date}|${x.text}`)
  const migrated=decode(JSON.stringify(raw))
  expect(migrated.gratitudes).toEqual(raw.gratitudes)
  expect(migrated.spirit.gratitude).toBe(5)
  expect(dailyGratitudePoints(migrated,date)).toBe(3)
  const next=recordGratitude(migrated,entry('new',{freeText:'今のありがとう'}))
  expect(next.gratitudes).toHaveLength(6)
  expect(next.spirit.gratitude).toBe(5)
 })
})
