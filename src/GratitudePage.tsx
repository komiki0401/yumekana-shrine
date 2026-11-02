import { useEffect, useRef, useState } from 'react'
import { Check, Heart, Shuffle, Sparkles, X } from 'lucide-react'
import type { Dream, Gratitude, Spirit } from './store'
import { DAILY_GRATITUDE_LIMIT, id, localDate } from './store'
import { spiritTotal } from './encounters'
import { gratitudeChoices, composeGratitude } from './gratitudeChoices'
import { GratitudeHistory } from './GratitudeHistory'

function shuffle(ids:string[]){const result=[...ids];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}

export function GratitudePage({entries,spirit,text,onText,selection,onSelection,dailyPoints,linkedDream,onUnlink,onRecord,onVisit}:{
 entries:Gratitude[];spirit:Spirit;text:string;onText:(text:string)=>void
 selection:string[];onSelection:(ids:string[])=>void;dailyPoints:number
 linkedDream:Dream|null;onUnlink:()=>void;onRecord:(entry:Gratitude)=>boolean;onVisit:()=>void
}){
 const [order,setOrder]=useState(()=>shuffle(gratitudeChoices.map(choice=>choice.id)))
 const [completed,setCompleted]=useState<Gratitude|null>(null),[celebrating,setCelebrating]=useState(false)
 const submitting=useRef(false),draftId=useRef(id())
 useEffect(()=>{if(!celebrating)return;const timer=setTimeout(()=>setCelebrating(false),2600);return()=>clearTimeout(timer)},[celebrating])
 const visible=order.slice(0,6).map(id=>gratitudeChoices.find(choice=>choice.id===id)!)
 const selected=selection.map(id=>gratitudeChoices.find(choice=>choice.id===id)).filter((choice):choice is typeof gratitudeChoices[number]=>!!choice)
 const ready=selected.length>0||!!text.trim()
 const days=new Set(entries.map(entry=>entry.date)).size
 function refresh(){setOrder([...shuffle(order.slice(6)),...shuffle(order.slice(0,6))])}
 function reset(){onText('');onSelection([]);onUnlink();draftId.current=id();submitting.current=false;setCompleted(null);setCelebrating(false);setOrder(shuffle(gratitudeChoices.map(choice=>choice.id)))}
 return <div className="gratitude-page">
  <section className={'content-card gratitude-writing gratitude-choice-writing'+(celebrating?' gratitude-celebrating':'')}>
   <p className="eyebrow"><Heart size={14}/> THANK YOU, TODAY</p><h2>今日のありがとう</h2>
   {completed?<div className="gratitude-complete" role="status">
    <div className="gratitude-offering-art" aria-hidden="true"><Heart size={38}/>{celebrating&&Array.from({length:10},(_,i)=><i key={i} style={{left:`${8+i*8}%`,animationDelay:`${i*.08}s`}}>✿</i>)}</div>
    <h3>ありがとうが、ひとつ光になりました。</h3><p>あなたの気持ちを、大切にお預かりしました。<br/>小さな幸せは、何度見つけても大丈夫。</p>
    <button className="primary full" onClick={reset}>もう一度ありがとうを奉納する</button>
   </div>:<>
    {linkedDream&&<div className="gratitude-linked"><span>叶った夢へのお礼<br/><b>{linkedDream.title}</b></span><button onClick={onUnlink}>紐づけを外す</button></div>}
    <form onSubmit={event=>{
     event.preventDefault();if(submitting.current||!ready)return
     submitting.current=true
     const now=new Date(),entry:Gratitude={id:draftId.current,text:composeGratitude(selected,text),selectedThanks:selected.map(choice=>({...choice})),freeText:text.trim(),date:localDate(now),createdAt:now.toISOString(),...(linkedDream?{dreamId:linkedDream.id}:{})}
     if(onRecord(entry)){onText('');onSelection([]);setCompleted(entry);setCelebrating(true)}else submitting.current=false
    }}>
     <h3 id="gratitude-question">今日、ちょっと幸せだったことは？</h3><p className="gratitude-choice-hint">ぴんときたものを、いくつでも。選ぶだけの奉納も大丈夫。</p>
     <div className="gratitude-choice-grid" role="group" aria-labelledby="gratitude-question">{visible.map(choice=><label key={choice.id} className={'gratitude-choice'+(selection.includes(choice.id)?' chosen':'')}><input type="checkbox" checked={selection.includes(choice.id)} onChange={()=>onSelection(selection.includes(choice.id)?selection.filter(id=>id!==choice.id):[...selection,choice.id])}/><span>{choice.label}</span></label>)}</div>
     <button className="gratitude-refresh" type="button" onClick={refresh}><Shuffle size={15}/>別の幸せを見る</button>
     {selected.length>0&&<div className="gratitude-selected-sentences" aria-live="polite"><small><Check size={13}/>あなたのありがとう</small>{selected.map(choice=><div key={choice.id}><p>{choice.sentence}</p><button type="button" aria-label={`${choice.label}の選択を外す`} onClick={()=>onSelection(selection.filter(id=>id!==choice.id))}><X size={15}/></button></div>)}</div>}
     <div className="gratitude-optional"><label htmlFor="gratitude-text">自分の言葉を添えて、もっと豊かさを受け取る（任意）</label><p>小さな幸せに気づくほど、毎日が少しずつ豊かになります。</p><textarea id="gratitude-text" aria-label="自分の言葉（任意）" value={text} onChange={event=>onText(event.target.value)} rows={3} maxLength={1000} placeholder="今日、心があたたかくなったことは…"/><small className="gratitude-character-count">{text.length} / 1000</small></div>
     <button className="primary full gratitude-offer-button" disabled={!ready}><Heart size={17}/>ありがとうを奉納する</button>
     <p className="gratitude-gentle-note">選択肢だけでも、自分の言葉だけでも。<br/>書く量や選ぶ数にかかわらず、大切なありがとうです。</p>
    </form>
   </>}
   <p className="gratitude-daily-note">今日の感謝度 <b>{dailyPoints} / {DAILY_GRATITUDE_LIMIT}</b><span>{dailyPoints>=DAILY_GRATITUDE_LIMIT?'今日の3ポイントは受け取り済みです。ありがとうは、引き続き何度でも奉納できます。':'1回の奉納で＋1、1日3ポイントまで。上限のあとも、ありがとうは何度でも残せます。'}</span></p>
  </section>
  <section className="spirit-panel gratitude-secondary-spirit" aria-label="感謝と期待の積み重ね">
   <div><span className="spirit-orb gratitude-orb"><Heart size={23}/></span><span><small>感謝度</small><strong>{spirit.gratitude}</strong><em>気づいた、ありがとう。</em></span></div>
   <div><span className="spirit-orb expectation-orb"><Sparkles size={23}/></span><span><small>期待度</small><strong>{spirit.expectation}</strong><em>思い描いた、これから。</em></span></div>
   <div className="spirit-total"><span>感謝度 ＋ 期待度</span><b>{spiritTotal(spirit)}</b><small>合計で出会いやすく、感謝と期待の内訳で彩り豊かに。</small></div><p>数字は減りません。あなたのペースで、少しずつ。</p>
  </section>
  <div className="gratitude-stats"><span><b>{entries.length}</b> 回のありがとう</span><span><b>{days}</b> 日の思い出</span><button onClick={onVisit}>境内を訪れる <span aria-hidden="true">↗</span></button></div>
  <GratitudeHistory entries={entries}/>
 </div>
}
