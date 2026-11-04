import type { AnimatedMiracleId } from './miracleCatalog'

type LegacyMiracleId = 'cat' | 'butterfly' | 'blossoms' | 'rainbow' | 'shootingStar' | 'meteorShower' | 'lightButterfly' | 'lightOrb' | 'deity' | 'deitySmile'
export type VectorMiracleId = Exclude<AnimatedMiracleId, LegacyMiracleId>
type Visual = { placement: 'ground' | 'sky' | 'panorama' | 'center'; motion: string; particles?: 'snow' | 'leaves' | 'fireflies' | 'stars' | 'petals' | 'gold' }
// Every new ID must have both its own illustration and a defined visual treatment.
export const vectorMiracles = {
  whiteCat: { placement: 'ground', motion: 'cat-arrival' },
  calicoCat: { placement: 'ground', motion: 'cat-stroll' },
  fox: { placement: 'ground', motion: 'fox-turn' },
  tanuki: { placement: 'ground', motion: 'tanuki-peek' },
  rabbit: { placement: 'ground', motion: 'rabbit-hop' },
  deer: { placement: 'ground', motion: 'deer-arrival' },
  sparrow: { placement: 'sky', motion: 'sparrow-flight' },
  firefly: { placement: 'panorama', motion: 'firefly-glow', particles: 'fireflies' },
  doubleRainbow: { placement: 'panorama', motion: 'rainbow-bloom' },
  sunbeams: { placement: 'panorama', motion: 'sunbeam-sway', particles: 'gold' },
  gentleSnow: { placement: 'panorama', motion: 'snowfall', particles: 'snow' },
  firstSnow: { placement: 'panorama', motion: 'first-snow', particles: 'snow' },
  autumnLeaves: { placement: 'panorama', motion: 'autumn-tint', particles: 'leaves' },
  swirlingLeaves: { placement: 'panorama', motion: 'leaf-whirl', particles: 'leaves' },
  dew: { placement: 'ground', motion: 'dew-shimmer' },
  lightMotes: { placement: 'panorama', motion: 'mote-drift', particles: 'gold' },
  fullMoon: { placement: 'sky', motion: 'moon-glow' },
  crescentMoon: { placement: 'sky', motion: 'crescent-rise' },
  milkyWay: { placement: 'panorama', motion: 'galaxy-drift', particles: 'stars' },
  aurora: { placement: 'panorama', motion: 'aurora-wave' },
  comet: { placement: 'sky', motion: 'comet-pass' },
  constellation: { placement: 'panorama', motion: 'constellation-glow', particles: 'stars' },
  moonHalo: { placement: 'sky', motion: 'halo-breathe' },
  heartCloud: { placement: 'sky', motion: 'cloud-drift' },
  foxfire: { placement: 'ground', motion: 'foxfire-drift' },
  glowingTorii: { placement: 'center', motion: 'torii-light', particles: 'gold' },
  ringingBell: { placement: 'center', motion: 'bell-sway' },
  glowingEma: { placement: 'ground', motion: 'ema-light', particles: 'gold' },
  rainbowWind: { placement: 'panorama', motion: 'wind-ribbon' },
  divineFootprints: { placement: 'center', motion: 'footprint-reveal' },
  sacredTree: { placement: 'ground', motion: 'tree-light', particles: 'gold' },
  goldenFeather: { placement: 'sky', motion: 'feather-fall' },
  sacredWhiteFox: { placement: 'ground', motion: 'sacred-fox', particles: 'gold' },
  dragon: { placement: 'panorama', motion: 'dragon-crossing' },
  phoenix: { placement: 'sky', motion: 'phoenix-flight', particles: 'gold' },
  goldenButterfly: { placement: 'sky', motion: 'golden-butterfly', particles: 'gold' },
  goldenGround: { placement: 'panorama', motion: 'golden-wash', particles: 'gold' },
  rainbowShootingStar: { placement: 'sky', motion: 'rainbow-meteor' },
  floweringTree: { placement: 'ground', motion: 'tree-flowering', particles: 'petals' },
  skyTorii: { placement: 'panorama', motion: 'heaven-gate', particles: 'stars' },
} as const satisfies Record<VectorMiracleId, Visual>

export function vectorVisual(kind: AnimatedMiracleId): Visual | undefined {
  return (vectorMiracles as Partial<Record<AnimatedMiracleId, Visual>>)[kind]
}
