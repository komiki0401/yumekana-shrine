import { useEffect, useRef, useState } from 'react'
import { ShrineAudio } from './shrineAudio'
import type { AudioStatus } from './shrineAudio'
import { readAudioPreferences } from './audioSettings'
import type { AudioPreferences } from './audioSettings'

export function useShrineAudio(settings: Partial<AudioPreferences> & { sound: boolean }) {
  const preferences = readAudioPreferences(settings)
  const [status, setStatus] = useState<AudioStatus>(preferences.bgmEnabled ? 'needs-gesture' : 'off')
  const engine = useRef<ShrineAudio | null>(null)
  const latest = useRef(settings); latest.current = settings
  useEffect(() => {
    const audio = new ShrineAudio(setStatus); engine.current = audio
    const p = readAudioPreferences(latest.current); audio.configure(p.bgmEnabled, p.bgmVolume)
    const visibility = () => audio.setHidden(document.hidden)
    const pageHide = () => audio.setHidden(true)
    visibility()
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pageHide)
    window.addEventListener('pageshow', visibility)
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pageHide); window.removeEventListener('pageshow', visibility); audio.dispose(); if (engine.current === audio) engine.current = null }
  }, [])
  useEffect(() => { engine.current?.configure(preferences.bgmEnabled, preferences.bgmVolume) }, [preferences.bgmEnabled, preferences.bgmVolume])
  return {
    status, preferences,
    play: () => void engine.current?.play(),
    stop: () => engine.current?.stop(),
    chime: () => engine.current?.chime(latest.current.sound, readAudioPreferences(latest.current).soundVolume),
    unlockEffects: () => engine.current?.unlockEffects(),
    stopEffects: () => engine.current?.stopEffects(),
  }
}
