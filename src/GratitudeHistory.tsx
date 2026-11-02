import { Heart, Sparkles } from 'lucide-react'
import type { Gratitude } from './store'

export function GratitudeHistory({entries}:{entries:Gratitude[]}){
 const ordered=[...entries].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id))
 return <section className="gratitude-records" aria-labelledby="gratitude-records-title"><h2 id="gratitude-records-title">ありがとうの奉納履歴</h2>
  {ordered.length?<div className="gratitude-cards">{ordered.map(entry=>{
   const structured=entry.selectedThanks!==undefined||entry.freeText!==undefined
   return <article className="gratitude-record" key={entry.id}>
    <time dateTime={entry.createdAt}>{formatTime(entry)}</time>
    {structured?<>
     {!!entry.selectedThanks?.length&&<div className="recorded-choices"><small>選んだありがとう</small><ul>{entry.selectedThanks.map(choice=><li key={choice.id} aria-label={`${choice.label}：${choice.sentence}`}>{choice.sentence}</li>)}</ul></div>}
     {entry.freeText&&<div className="recorded-free-text"><small>自分の言葉</small><p>{entry.freeText}</p></div>}
    </>:<p>{entry.text}</p>}
    {entry.dreamId&&<span className="gratitude-dream-tag"><Sparkles size={12}/>叶った夢へのお礼</span>}
   </article>
  })}</div>:<div className="gratitude-empty"><Heart size={30}/><p>美味しいご飯、大切な人の笑顔、穏やかなひととき。<br/>あなたの「ありがとう」が、ここに積み重なっていきます。</p></div>}
 </section>
}
function formatTime(entry:Gratitude){const time=new Date(entry.createdAt);return Number.isNaN(time.getTime())?entry.date:time.toLocaleString('ja-JP',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
