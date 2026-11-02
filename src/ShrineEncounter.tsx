import { useEffect, useRef, useState } from 'react'
import type { Encounter, Spirit } from './store'
import { id, localDate } from './store'
import { encounterCatalog, rollEncounter } from './encounters'

export function ShrineEncounter({ spirit, paused, onEncounter }: {
 spirit: Spirit; paused: boolean; onEncounter: (entry: Encounter) => void
}) {
 const [encounter, setEncounter] = useState<Encounter | null>(null)
 const latest = useRef({ spirit, onEncounter })
 useEffect(() => { latest.current = { spirit, onEncounter } }, [spirit, onEncounter])
 useEffect(() => {
  if (paused) return
  function visit() {
   if (document.hidden) return
   const kind = rollEncounter(latest.current.spirit)
   if (!kind) return
   const now = new Date()
   const entry = { id: id(), kind, date: localDate(now), createdAt: now.toISOString() }
   setEncounter(entry)
   latest.current.onEncounter(entry)
  }
  const first = setTimeout(visit, 8000)
  const interval = setInterval(visit, 60000)
  return () => { clearTimeout(first); clearInterval(interval) }
 }, [paused])
 useEffect(() => {
  if (!encounter || paused) return
  const timer = setTimeout(() => setEncounter(null), 18000)
  return () => clearTimeout(timer)
 }, [encounter, paused])
 if (!encounter) return null
 const detail = encounterCatalog[encounter.kind]
 return <div className={'shrine-encounter encounter-' + encounter.kind}>
  <div className="encounter-art" aria-hidden="true"><span>{detail.symbol}</span>{['deity','miracle'].includes(encounter.kind) && <i className="deity-light"/>}</div>
  {['blossoms','miracle'].includes(encounter.kind) && <div className="encounter-petals" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${i*8}%`,animationDelay:`-${i*.4}s`}}>✿</i>)}</div>}
  <div className="encounter-caption" role="status"><b>{detail.title}</b><span>{detail.message}</span><button aria-label="特別演出を閉じる" onClick={() => setEncounter(null)}>×</button></div>
 </div>
}
