import type { Spirit } from './store'
import { getShrineGrowth, shrineStages } from './shrineGrowth'
import './shrineGrowth.css'

export function ShrineGrowthStatus({ spirit }: { spirit: Spirit }) {
  const { stage, total, next, remaining, progress } = getShrineGrowth(spirit)
  return <section className="shrine-growth-status" aria-label="境内の成長">
    <div className="growth-heading"><span className="growth-seal" aria-hidden="true">✿</span><div><small>感謝と夢が育てる、境内の彩り</small><h2><span>彩り {stage.level}</span>{stage.name}</h2><p>{stage.description}</p></div></div>
    <div className="growth-progress"><span>感謝度 ＋ 期待度 <b>{total}</b></span>{next ? <><small>次の彩りまで、あと {remaining}</small><progress aria-label="次の境内までの積み重ね" max="1" value={progress}/></> : <small>これからも、あなたのペースで。</small>}</div>
    <details className="growth-guide"><summary>境内の育ち方を見る</summary><ol>{shrineStages.map(item => <li key={item.level} aria-current={item.level === stage.level ? 'step' : undefined}><span>彩り {item.level} · {item.name}</span><small>合計 {item.threshold}〜</small><p>{item.description}</p></li>)}</ol><p>夢を書くと期待度、ありがとうを奉納すると感謝度が育ちます。毎日の義務はありません。</p></details>
  </section>
}

function Blossom({ x, y, size = 7, color = '#e7aec2' }: { x: number; y: number; size?: number; color?: string }) {
  return <g transform={`translate(${x} ${y})`} fill={color}>{[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cx="0" cy={-size * .55} rx={size * .4} ry={size * .6} transform={`rotate(${angle})`}/>)}<circle r={size * .22} fill="#e4be78"/></g>
}
function FlowerBed({ x, y, rich }: { x: number; y: number; rich: boolean }) {
  return <g className="growth-flowerbed" transform={`translate(${x} ${y})`}>
    <ellipse cy="8" rx={rich ? 50 : 36} ry="13" fill="#acb899" opacity=".7"/>
    {Array.from({ length: rich ? 9 : 5 }, (_, i) => { const px = (i % 5 - 2) * 13, py = -10 - Math.floor(i / 5) * 14; return <g key={i}><path d={`M${px} 8V${py}m0 10q-12-14-15-6m15 1q12-14 15-6`} fill="none" stroke="#8fa584" strokeWidth="2"/><Blossom x={px} y={py} size={6 + i % 3} color={i % 2 ? '#d5bbdc' : '#e9b8c7'}/></g> })}
  </g>
}
function Lantern({ x, y, golden = false }: { x: number; y: number; golden?: boolean }) {
  return <g className="growth-lantern" transform={`translate(${x} ${y}) scale(.72)`}>
    <ellipse cy="-52" rx="54" ry="62" fill="url(#growth-lantern-glow)"/>
    <path d="M-16 0H16M-6 0V-46H6V0" stroke={golden ? '#b99a68' : '#9b9e89'} strokeWidth="7" fill="none"/>
    <rect x="-23" y="-91" width="46" height="48" rx={golden ? 13 : 3} fill={golden ? '#f4dfb4' : '#bac1a5'} stroke={golden ? '#b89a6e' : '#9ba48c'} strokeWidth="2"/>
    <rect x="-14" y="-82" width="28" height="29" rx="3" fill="#fff1bc"/>
    <path d="M-30-92L0-112L30-92Z" fill={golden ? '#be9e69' : '#858e75'}/>
    <path d="M0-81V-54M-14-68H14" stroke="#d3b783" strokeWidth="2"/>
  </g>
}
function Pavilion({ x, mirror = false }: { x: number; mirror?: boolean }) {
  return <g className="growth-pavilion" transform={`translate(${x} 0) ${mirror ? 'scale(-1 1)' : ''}`}>
    <rect x="-61" y="353" width="122" height="87" rx="3" fill="#cdab88"/>
    <rect x="-44" y="366" width="88" height="70" fill="#e9d4b2"/>
    <path d="M-25 370V436M0 370V436M25 370V436" stroke="#ac8b68" strokeWidth="5"/>
    <path d="M-83 358Q-51 342-39 318H39Q51 342 83 358Q0 372-83 358" fill="#828776" stroke="#d6bc83" strokeWidth="4"/>
    <path d="M-45 319L0 294L45 319" fill="none" stroke="#dbc28c" strokeWidth="5"/>
    <path d="M-64 444H64" stroke="#a28b70" strokeWidth="8"/>
    <Blossom x={0} y={340} size={9} color="#ebcb91"/>
  </g>
}

/** All decor shares the shrine's SVG coordinates, including the portrait crop. */
export function ShrineGrowthDecor({ level, layer, portrait = false }: { level: number; layer: 'landscape' | 'shrine' | 'ornaments'; portrait?: boolean }) {
  if (level < 2) return null
  const rich = level >= 3
  if (layer === 'landscape') return <g className="growth-landscape" aria-hidden="true">
    {rich && <><Pavilion x={265}/><Pavilion x={735} mirror/>
      <g className="growth-pond" transform={portrait ? undefined : "translate(0 177) scale(1 .45)"}><ellipse cx="248" cy="675" rx="69" ry="32" fill="#a7bfb3" stroke="#c9c5a2" strokeWidth="8"/><path d="M201 682Q243 693 284 681M215 669Q243 678 271 668" stroke="#dce7d8" strokeWidth="2" fill="none"/>
        <path d="M191 650Q242 620 300 650M194 660Q244 633 298 660" fill="none" stroke="#b99977" strokeWidth="7"/>
        <path d="M195 650V670M222 639V658M268 640V658M296 650V670" stroke="#b99977" strokeWidth="4"/>
        <ellipse cx="756" cy="690" rx="58" ry="26" fill="#adc3b7" stroke="#c9c5a2" strokeWidth="7"/>
        <path d="M722 695Q756 706 787 693" stroke="#dce7d8" strokeWidth="2" fill="none"/>
        <ellipse cx="741" cy="685" rx="12" ry="5" fill="#90aa91"/><Blossom x={763} y={680} size={10}/>
      </g></>}
    {[{ x: 328, y: portrait ? 548 : 475 }, { x: 672, y: portrait ? 548 : 475 }, { x: 205, y: portrait ? 750 : 503 }, { x: 795, y: portrait ? 750 : 503 }].map(p => <FlowerBed key={p.x} {...p} rich={rich}/>)}
    <Lantern x={334} y={portrait ? 590 : 490}/><Lantern x={666} y={portrait ? 590 : 490}/>
    {rich && <><Lantern x={289} y={portrait ? 735 : 515} golden/><Lantern x={711} y={portrait ? 735 : 515} golden/>
      <FlowerBed x={350} y={455} rich/><FlowerBed x={650} y={455} rich/>
    </>}
  </g>
  if (layer === 'shrine') return <g className="growth-shrine-trim" aria-hidden="true">
    <path d="M399 247L500 191L601 247M327 300Q408 314 500 300Q590 314 673 300" stroke={rich ? '#dfc17e' : '#ccba91'} strokeWidth={rich ? 5 : 2} fill="none"/>
    {rich && <>
      <path d="M414 244L500 201L586 244M419 250L500 212L581 250" stroke="#dfc894" strokeWidth="2" fill="none"/>
      <path d="M330 298q-24-5-20-24q6 13 22 15M670 298q24-5 20-24q-6 13-22 15" fill="#dfbf7f"/>
      <path d="M376 320V408M624 320V408" stroke="#e5cb91" strokeWidth="5"/>
      <circle cx="500" cy="231" r="13" fill="none" stroke="#f3dc9f" strokeWidth="2"/>
      {[390, 424, 458, 542, 576, 610].map((x, i) => <Blossom key={x} x={x} y={305 + i % 2 * 3} size={5} color="#dfbe80"/>)}
    </>}
  </g>
  return <g className="growth-ornaments" aria-hidden="true">{rich && <>
      <path d="M266 244V494M735 244V494M228 287H772" stroke="#e0b67d" strokeWidth="2" fill="none" opacity=".8"/>
      <path d="M205 220Q500 251 795 220" stroke="#e5c486" strokeWidth="3" fill="none"/>
      <g className="growth-soft-light"><ellipse cx="500" cy="284" rx="190" ry="145" fill="url(#growth-sanctuary-glow)"/></g>
      {[{ x: 330, y: 199 }, { x: 624, y: 175 }, { x: 680, y: 347 }, { x: 306, y: 390 }, { x: 570, y: 143 }, { x: 428, y: 174 }].map((p, i) => <path key={i} className="growth-sparkle" d={`M${p.x} ${p.y - 5}q1 4 5 5q-4 1-5 5q-1-4-5-5q4-1 5-5`} fill="#fff0b8" style={{ animationDelay: `${-i * 1.4}s` }}/>) }
    </>}
  </g>
}
