import type { Spirit } from './store'
import { implementedMiracles } from './miracleCatalog'
import type { AnimatedMiracleId, MiracleCategory, Rarity, MiracleCondition, MiracleDefinition } from './miracleCatalog'

export const encounterCatalog = Object.fromEntries(implementedMiracles.map(item => [item.id, item]))
export const ENCOUNTER_RATE_MULTIPLIER = 3
export const MAX_ENCOUNTER_RATE = .95
export const spiritTotal = (spirit: Spirit) => Math.max(0, spirit.gratitude) + Math.max(0, spirit.expectation)
export const encounterSettings = {
 firstDelayMs: 8000, intervalMs: 60000, durationMs: 18000,
 baseRarity: { N: .50, R: .30, SR: .15, SSR: .04, UR: .01 } as Record<Rarity,number>,
 categoryBoost: .8, divineBoost: .6,
}

// Occurrence is separate from rarity; retain the previous boosted overall curve.
export function encounterRate(spirit: Spirit): number {
 const t = spiritTotal(spirit)
 const base = (t >= 1 ? Math.min(.24,.04+t*.006) : .04)
  + (t >= 3 ? Math.min(.14,.025+t*.002)+Math.min(.15,.025+t*.002) : 0)
  + (t >= 5 ? Math.min(.14,.025+t*.002) : 0)
  + (t >= 8 ? Math.min(.05,.006+t*.0005) : 0)
  + (t >= 40 ? Math.min(.012,.003+t*.00005) : 0)
 return Math.min(MAX_ENCOUNTER_RATE,base*ENCOUNTER_RATE_MULTIPLIER)
}

export function rarityProbabilities(spirit: Spirit): Record<Rarity,number> {
 const growth = Math.min(1,spiritTotal(spirit)/100)
 const harmony = Math.min(1,Math.min(spirit.gratitude,spirit.expectation)/50)
 const base=encounterSettings.baseRarity
 const values: Record<Rarity,number> = {
  N: base.N*(1-.15*growth), R:base.R,
  SR:base.SR*(1+.35*growth), SSR:base.SSR*(1+.7*growth+.3*harmony), UR:base.UR*(1+growth+.5*harmony),
 }
 const sum = Object.values(values).reduce((a,b)=>a+b,0)
 return Object.fromEntries(Object.entries(values).map(([key,value])=>[key,value/sum])) as Record<Rarity,number>
}

export function categoryAffinity(category: MiracleCategory, spirit: Spirit): number {
 const g = Math.max(0,spirit.gratitude), e = Math.max(0,spirit.expectation)
 if (category === 'animals' || category === 'nature') return 1+encounterSettings.categoryBoost*g/(g+20)
 if (category === 'sky' || category === 'mystic') return 1+encounterSettings.categoryBoost*e/(e+20)
 const both = Math.min(g,e)
 return 1+encounterSettings.divineBoost*both/(both+20)
}

export function matchesMiracleConditions(conditions:MiracleCondition|undefined,date=new Date()):boolean{
 if(!conditions)return true
 const month=date.getMonth(),hour=date.getHours()
 const season=month<2||month===11?'winter':month<5?'spring':month<8?'summer':'autumn'
 const time=hour>=6&&hour<18?'day':'night'
 return (!conditions.season||conditions.season===season)&&(!conditions.time||conditions.time===time)
}

export function encounterWeights(spirit: Spirit,date=new Date()): {kind: AnimatedMiracleId; weight:number}[] {
 const rate=encounterRate(spirit),rarities=rarityProbabilities(spirit)
 const available=implementedMiracles.filter(item=>matchesMiracleConditions((item as MiracleDefinition).conditions,date))
 const availableRarity=[...new Set(available.map(item=>item.rarity))].reduce((sum,rarity)=>sum+rarities[rarity],0)
 return available.map(item=>{
  const peers=available.filter(peer=>peer.rarity===item.rarity)
  const total=peers.reduce((sum,peer)=>sum+categoryAffinity(peer.category,spirit),0)
  return {kind:item.id,weight:rate*rarities[item.rarity]/availableRarity*categoryAffinity(item.category,spirit)/total}
 })
}
export function rollEncounter(spirit: Spirit, random=Math.random): AnimatedMiracleId|null {
 let roll=random()
 for(const entry of encounterWeights(spirit)){if(roll<entry.weight)return entry.kind;roll-=entry.weight}
 return null
}
