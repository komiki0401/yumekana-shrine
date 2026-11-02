import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { Encounter, Spirit } from './store'
import { id, localDate } from './store'
import { encounterSettings, rollEncounter } from './encounters'
import { encounterImages } from './encounterImages'
import { isAnimatedMiracle, miracleCatalog, rarityLabels } from './miracleCatalog'
import type { AnimatedMiracleId } from './miracleCatalog'

const EncounterPreview=import.meta.env.DEV?lazy(()=>import('./EncounterPreview')):null

export function ShrineEncounter({spirit,paused,onEncounter}:{spirit:Spirit;paused:boolean;onEncounter:(entry:Encounter)=>void}){
 const [active,setActive]=useState<{entry:Encounter;preview:boolean}|null>(null)
 const latest=useRef({spirit,paused,onEncounter})
 const alive=useRef(false),busy=useRef(false),token=useRef(0)
 useEffect(()=>{latest.current={spirit,paused,onEncounter}},[spirit,paused,onEncounter])
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;token.current++}},[])
 const close=useCallback(()=>{token.current++;busy.current=false;setActive(null)},[])
 const play=useCallback(async(kind:AnimatedMiracleId,preview=false)=>{
  if(!isAnimatedMiracle(kind)||(!preview&&(busy.current||latest.current.paused||document.hidden)))return
  const request=++token.current;busy.current=true;let shown=false
  try{
   const image=new Image();image.src=encounterImages[kind];await image.decode()
   if(!alive.current||request!==token.current||(!preview&&(latest.current.paused||document.hidden)))return
   const now=new Date(),entry={id:id(),kind,date:localDate(now),createdAt:now.toISOString()}
   shown=true;setActive({entry,preview})
   if(!preview)latest.current.onEncounter(entry)
  }catch{/* A failed asset does not become a discovery. */}
  finally{if(request===token.current&&!shown)busy.current=false}
 },[])
 useEffect(()=>{
  if(paused)return
  const visit=()=>{if(document.hidden||busy.current)return;const kind=rollEncounter(latest.current.spirit);if(kind)void play(kind)}
  const first=setTimeout(visit,encounterSettings.firstDelayMs),interval=setInterval(visit,encounterSettings.intervalMs)
  return()=>{clearTimeout(first);clearInterval(interval)}
 },[paused,play])
 useEffect(()=>{
  if(!active||paused)return
  const timeout=setTimeout(close,encounterSettings.durationMs)
  return()=>clearTimeout(timeout)
 },[active,paused,close])
 const kind=active?.entry.kind
 const detail=miracleCatalog.find(item=>item.id===kind)
 const alias=kind==='deitySmile'?' encounter-miracle':kind==='lightButterfly'?' encounter-butterfly':''
 return <>
  {EncounterPreview&&<Suspense fallback={null}><EncounterPreview onPlay={id=>void play(id,true)} onClose={close}/></Suspense>}
  {active&&kind&&isAnimatedMiracle(kind)&&detail&&<div key={active.entry.id} className={'shrine-encounter encounter-'+kind+alias}>
   {kind==='meteorShower'?<div className="meteor-lanes" aria-hidden="true">{[0,1,2,3,4].map(i=><img className="encounter-image meteor-star" key={i} src={encounterImages[kind]} alt="" draggable={false} style={{top:`${13+i*9}%`,animationDelay:`${i*.65}s`}}/>)}</div>:<div className="encounter-art encounter-image-art" aria-hidden="true"><img className="encounter-image" src={encounterImages[kind]} alt="" draggable={false}/></div>}
   {['blossoms','deitySmile'].includes(kind)&&<div className="encounter-petals" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${i*8}%`,animationDelay:`-${i*.4}s`}}/>)}</div>}
   {kind==='lightButterfly'&&<div className="butterfly-sparkles" aria-hidden="true">✧　·　✧</div>}
   <div className="encounter-caption" role="status"><small className={'rarity-badge rarity-'+detail.rarity}>{detail.rarity} · {rarityLabels[detail.rarity]}{active.preview?' · 開発プレビュー':''}</small><b>{detail.title}</b><span>{detail.message}</span><button aria-label="特別演出を閉じる" onClick={close}>×</button></div>
  </div>}
 </>
}
