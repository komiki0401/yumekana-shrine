import type { CSSProperties } from 'react'
import type { AnimatedMiracleId } from './miracleCatalog'
import { encounterImages } from './encounterImages'
import { vectorVisual } from './miracleVisuals'
import './miracleAnimations.css'

export function VectorMiracle({ kind }: { kind: AnimatedMiracleId }) {
  const visual = vectorVisual(kind)
  if (!visual) return null
  return <div className={'vector-miracle visual-' + visual.motion} data-miracle-art={kind} aria-hidden="true">
    <div className={'vector-placement placement-' + visual.placement}>
      <div className="vector-journey"><img className="encounter-image vector-illustration" src={encounterImages[kind]} alt="" draggable={false}/></div>
    </div>
    {visual.particles && <div className={'miracle-particles particles-' + visual.particles}>
      {Array.from({ length: visual.particles === 'snow' ? 16 : 10 }, (_, i) => <i key={i} style={{ '--x': `${8 + (i * 29) % 86}%`, '--y': `${18 + (i * 17) % 65}%`, '--delay': `${-i * .73}s`, '--duration': `${7 + i % 4 * 1.8}s`, '--size': `${4 + i % 3 * 2}px` } as CSSProperties}/>)}
    </div>}
  </div>
}
