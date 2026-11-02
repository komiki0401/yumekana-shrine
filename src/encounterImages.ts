import type { EncounterKind } from './store'

// Keep the approved transparent PNG originals. Vite generates base-aware asset URLs.
// Each image is downloaded only when its encounter is drawn.
export const encounterImages: Record<EncounterKind, string> = {
 cat: new URL('./assets/encounters/cat.png', import.meta.url).href,
 blossoms: new URL('./assets/encounters/blossoms.png', import.meta.url).href,
 butterfly: new URL('./assets/encounters/butterfly.png', import.meta.url).href,
 shootingStar: new URL('./assets/encounters/shooting-star.svg', import.meta.url).href,
 deity: new URL('./assets/encounters/deity.png', import.meta.url).href,
 miracle: new URL('./assets/encounters/miracle.png', import.meta.url).href,
}
