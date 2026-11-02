import { useState } from 'react'
import { miracleCatalog } from './miracleCatalog'
import type { AnimatedMiracleId } from './miracleCatalog'

export default function EncounterPreview({onPlay,onClose}:{onPlay:(id:AnimatedMiracleId)=>void;onClose:()=>void}){
 const [selected,setSelected]=useState<AnimatedMiracleId>('cat')
 return <details className="encounter-preview"><summary>開発用：演出確認（記録しません）</summary><label>演出<select value={selected} onChange={e=>setSelected(e.target.value as AnimatedMiracleId)}>{miracleCatalog.map(item=><option key={item.id} value={item.id} disabled={!item.implemented}>{item.number}. {item.title} · {item.rarity}{!item.implemented?'（未実装）':''}</option>)}</select></label><div><button onClick={()=>onPlay(selected)}>再生（保存しない）</button><button onClick={onClose}>演出を閉じる</button></div></details>
}
