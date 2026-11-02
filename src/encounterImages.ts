import type { AnimatedMiracleId } from './miracleCatalog'
export const encounterImages: Record<AnimatedMiracleId,string> = {
 cat:new URL('./assets/encounters/cat.png',import.meta.url).href,
 butterfly:new URL('./assets/encounters/butterfly.png',import.meta.url).href,
 blossoms:new URL('./assets/encounters/blossoms.png',import.meta.url).href,
 rainbow:new URL('./assets/encounters/rainbow.svg',import.meta.url).href,
 shootingStar:new URL('./assets/encounters/shooting-star.svg',import.meta.url).href,
 meteorShower:new URL('./assets/encounters/shooting-star.svg',import.meta.url).href,
 lightButterfly:new URL('./assets/encounters/butterfly.png',import.meta.url).href,
 lightOrb:new URL('./assets/encounters/light-orb.svg',import.meta.url).href,
 deity:new URL('./assets/encounters/deity.png',import.meta.url).href,
 deitySmile:new URL('./assets/encounters/miracle.png',import.meta.url).href,
}
