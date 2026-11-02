import type { Encounter } from './store'
import { isAnimatedMiracle, resolveMiracleId } from './miracleCatalog'
import type { AnimatedMiracleId } from './miracleCatalog'

// Derived from the existing encounter log. Legacy "miracle" becomes deitySmile.
export function firstDiscoveries(entries: Encounter[]): Map<AnimatedMiracleId,Encounter> {
 const discoveries=new Map<AnimatedMiracleId,Encounter>()
 for(const entry of entries){
  const id=resolveMiracleId(entry.kind)
  if(!id||!isAnimatedMiracle(id))continue
  const previous=discoveries.get(id)
  if(!previous||entry.createdAt<previous.createdAt)discoveries.set(id,entry)
 }
 return discoveries
}
