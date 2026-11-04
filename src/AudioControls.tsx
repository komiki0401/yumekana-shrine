import { Music2, Play, Pause, Volume2 } from 'lucide-react'
import { shrineTrack, readAudioPreferences } from './audioSettings'
import type { Data } from './store'
import type { AudioStatus } from './shrineAudio'
import './audio.css'

type Props = {
  settings: Data['settings']; status: AudioStatus
  onBgm: (enabled: boolean) => void
  onEffects: (enabled: boolean) => void
  onVolume: (key: 'bgmVolume' | 'soundVolume', volume: number) => void
  onResume: () => void; onChime: () => void
}
export const audioStatusText: Record<AudioStatus, string> = {
  off: '音楽はオフです。好きなときに、そっと。',
  'needs-gesture': '再開ボタンを押すと、音楽が流れます。',
  loading: '音楽を準備しています…',
  playing: 'こもれびのような音楽が流れています。',
  paused: '画面を離れている間、音楽を休めています。',
  error: 'BGMを読み込めませんでした。通信を確認して、もう一度お試しください。',
}
export function AudioControls({ settings, status, onBgm, onEffects, onVolume, onResume, onChime }: Props) {
  const preferences = readAudioPreferences(settings)
  return <section className="audio-settings" aria-label="BGMと効果音">
    <div className="audio-track"><span className="audio-emblem" aria-hidden="true"><Music2 size={30}/></span><div><p className="eyebrow">YUMEKANA SOUND</p><h3>{shrineTrack.title}</h3><p>{shrineTrack.description}</p></div></div>
    <label className="audio-toggle"><span><b>BGM</b><small>神社で過ごす、穏やかな時間に。</small></span><input type="checkbox" aria-label="BGMを有効にする" checked={preferences.bgmEnabled} onChange={e => onBgm(e.target.checked)}/></label>
    <label className="audio-range">BGMの音量 <output>{Math.round(preferences.bgmVolume * 100)}%</output><input aria-label="BGMの音量" type="range" min="0" max="100" step="1" value={Math.round(preferences.bgmVolume * 100)} onChange={e => onVolume('bgmVolume', Number(e.target.value) / 100)}/></label>
    {(status === 'needs-gesture' || status === 'error') && preferences.bgmEnabled && <button className="primary full" onClick={onResume}><Play size={16}/>{status === 'error' ? 'BGMを再試行' : 'BGMを再開'}</button>}
    <p className={'audio-status' + (status === 'error' ? ' audio-error' : '')} role={status === 'error' ? 'alert' : 'status'}>{audioStatusText[status]}</p>
    <div className="audio-effects"><label className="audio-toggle"><span><b>効果音</b><small>お賽銭や、ありがとうの鈴の音。</small></span><input type="checkbox" aria-label="効果音を有効にする" checked={settings.sound} onChange={e => onEffects(e.target.checked)}/></label>
      <label className="audio-range">効果音の音量 <output>{Math.round(preferences.soundVolume * 100)}%</output><input aria-label="効果音の音量" type="range" min="0" max="100" step="1" value={Math.round(preferences.soundVolume * 100)} onChange={e => onVolume('soundVolume', Number(e.target.value) / 100)}/></label>
      <button className="audio-sample" disabled={!settings.sound} onClick={onChime}><Volume2 size={15}/>効果音を試聴</button>
    </div>
    <p className="help-text">設定はこの端末に保存されます。画面を離れると一時停止し、再読み込み後はボタンから再開できます。<br/>オリジナル曲「こもれびの願い」· 96秒のループ</p>
  </section>
}

export function HomeAudio({ status, onToggle, onSettings }: { status: AudioStatus; onToggle: () => void; onSettings: () => void }) {
  const active = status === 'playing' || status === 'loading'
  const label = status === 'loading' ? '読み込みをやめる' : status === 'playing' ? 'BGMを止める' : status === 'off' ? 'BGMを聴く' : status === 'error' ? 'BGMを再試行' : 'BGMを再開'
  return <div className="home-audio" data-audio-state={status}>
    <div className="home-audio-title"><Music2 size={21}/><span><small>神社の音だより</small><b>{shrineTrack.title}</b></span></div>
    <div className="home-audio-actions"><button className="audio-play" onClick={onToggle} aria-pressed={active}>{active ? <Pause size={15}/> : <Play size={15}/>} {label}</button><button className="audio-options" onClick={onSettings}>音量と効果音</button></div>
    {status === 'error' && <p role="alert" className="audio-error">{audioStatusText[status]}</p>}
  </div>
}
