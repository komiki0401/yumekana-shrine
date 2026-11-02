import { useState } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import type { Encounter } from './store'
import { miracleCatalog, rarityLabels, categoryLabels, isAnimatedMiracle } from './miracleCatalog'
import type { Rarity } from './miracleCatalog'
import { firstDiscoveries } from './discoveries'
import { encounterImages } from './encounterImages'

export function MiracleBook({entries,onBack}:{entries:Encounter[];onBack:()=>void}){
 const [filter,setFilter]=useState<Rarity|'all'>('all')
 const discoveries=firstDiscoveries(entries)
 const visible=miracleCatalog.filter(item=>filter==='all'||item.rarity===filter)
 return <section className="miracle-book">
  <div className="book-overview"><BookOpen size={32}/><div><span>あなたが出会った、小さな奇跡</span><b>{discoveries.size} <small>/ {miracleCatalog.length}</small></b></div><button onClick={onBack}><ArrowLeft size={15}/>境内へ戻る</button></div>
  <p className="book-note">現在、境内で出会える奇跡は10種類。これから少しずつ増えていきます。<br/>何度出会っても、最初の思い出は大切に残ります。</p>
  <div className="book-filters" role="group" aria-label="レアリティで絞り込む">{(['all','N','R','SR','SSR','UR'] as const).map(rarity=><button key={rarity} aria-pressed={filter===rarity} onClick={()=>setFilter(rarity)}>{rarity==='all'?'すべて':`${rarity}：${rarityLabels[rarity]}`}</button>)}</div>
  <div className="book-grid">{visible.map(item=>{
   const first=isAnimatedMiracle(item.id)?discoveries.get(item.id):undefined
   return <article key={item.id} className={'miracle-card '+(first?'discovered':'undiscovered')} aria-label={first?item.title:`No.${item.number} 未発見`}>
    <div className="miracle-card-top"><span>No. {String(item.number).padStart(2,'0')}</span><span className={'rarity-badge rarity-'+item.rarity}>{item.rarity}</span></div>
    <div className="book-art">{first&&isAnimatedMiracle(item.id)?<img src={encounterImages[item.id]} alt="" loading="lazy"/>:<span aria-hidden="true">?</span>}</div>
    <small className="book-category">{categoryLabels[item.category]}</small><h2>{first?item.title:'まだ見ぬ奇跡'}</h2>
    {first?<><p>{item.message}</p><time dateTime={first.createdAt}>初めての出会い<br/>{formatDiscoveryTime(first.createdAt,first.date)}</time></>:<p>{item.implemented?'いつか境内で出会えるかもしれません。':'これから訪れる、新しい出会い。'}</p>}
   </article>
  })}</div>
 </section>
}
function formatDiscoveryTime(value:string,date:string){const time=new Date(value);return Number.isNaN(time.getTime())?date:time.toLocaleString('ja-JP',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
