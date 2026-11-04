export type AudioPreferences = { bgmEnabled: boolean; bgmVolume: number; soundVolume: number }
export const audioDefaults: AudioPreferences = { bgmEnabled: false, bgmVolume: .35, soundVolume: .5 }
export function readAudioPreferences(value: Partial<AudioPreferences>): AudioPreferences {
  const volume = (n: unknown, fallback: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback
  return { bgmEnabled: value.bgmEnabled === true, bgmVolume: volume(value.bgmVolume, audioDefaults.bgmVolume), soundVolume: volume(value.soundVolume, audioDefaults.soundVolume) }
}
export const shrineTrack = {
  title: 'こもれびの願い',
  description: 'ピアノと笛が紡ぐ、静かな朝の音楽。',
  src: import.meta.env.BASE_URL + 'audio/komorebi-no-negai.mp3',
  loopSeconds: 96,
}
