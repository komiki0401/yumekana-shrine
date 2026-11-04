"""Render the original 96-second Yumekana Shrine piece 'こもれびの願い'.
Requires numpy, scipy and FFmpeg for offline production only.
Usage: python3 scripts/render-shrine-bgm.py --samples /path/to/MIS/files
Piano pp individual notes + flute.nonvib.pp.zip from University of Iowa MIS.
Official permission: https://theremin.music.uiowa.edu/MIS.html
No downloads or music synthesis run in the app or in the normal build.
"""
from pathlib import Path
from zipfile import ZipFile
import argparse, hashlib, json, subprocess
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, minimum_filter1d

RATE=44100
SECONDS=96
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--samples',type=Path,required=True)
args=parser.parse_args()
S=args.samples
N=RATE*SECONDS
rng=np.random.default_rng(7041)
mix=np.zeros((N,2),dtype=np.float64)
source_hashes={}

def read_pcm(path):
    source_hashes[path.name]=hashlib.sha256(path.read_bytes()).hexdigest()
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','1','-ar',str(RATE),'-'])
    return np.frombuffer(raw,dtype='<f4').astype(float)

def envelope(a,attack=.015,release=.8):
    a=a.copy()
    head=min(len(a)//2,int(attack*RATE));tail=min(len(a)//2,int(release*RATE))
    a[:head]*=np.sin(np.linspace(0,np.pi/2,head))**2
    a[-tail:]*=np.cos(np.linspace(0,np.pi/2,tail))**2
    return a

def place(a,time,level,pan=0):
    start=int(time*RATE)%N
    a=a*level
    idx=(start+np.arange(len(a)))%N
    mix[idx,0]+=a*np.cos((pan+1)*np.pi/4)
    mix[idx,1]+=a*np.sin((pan+1)*np.pi/4)

def clean(a,low=55,high=6500):
    return sosfilt(butter(2,[low,high],fs=RATE,btype='bandpass',output='sos'),a)

piano={}
for note in ['D3','A3','B3','D4','E4','Gb4','A4','B4','D5','E5']:
    a=read_pcm(S/f'Piano.pp.{note}.aiff')
    onset=np.flatnonzero(np.abs(a)>.002*np.max(np.abs(a)))[0]
    a=a[max(0,onset-int(.008*RATE)):][:int(11*RATE)]
    a=clean(a)
    piano[note]=envelope(a/max(np.max(np.abs(a)),.001),.008,1.8)

flute_dir=S/'flute'
flute_dir.mkdir(exist_ok=True)
with ZipFile(S/'flute.nonvib.pp.zip') as z:
    for name in z.namelist():
        if '/' not in name and name.endswith('.aiff'): (flute_dir/name).write_bytes(z.read(name))
flute={}
for name,first in [('flute.nonvib.pp.B3B4.aiff',59),('flute.nonvib.pp.B4Bb5.aiff',71)]:
    a=read_pcm(flute_dir/name)
    hop=882; trimmed=a[:len(a)//hop*hop]
    rms=np.sqrt(np.mean(trimmed.reshape(-1,hop)**2,axis=1))
    mask=minimum_filter1d(maximum_filter1d(rms>max(.0005,rms.max()*.08),7),7)
    change=np.diff(np.r_[False,mask,False].astype(int))
    starts=np.where(change==1)[0]*hop; ends=np.where(change==-1)[0]*hop
    regions=[(s,e) for s,e in zip(starts,ends) if e-s>.2*RATE]
    for i,(s,e) in enumerate(regions):
        segment=a[max(0,s-int(.035*RATE)):min(len(a),e+int(.12*RATE))]
        segment=clean(segment,150,5100)
        flute[first+i]=segment/max(np.max(np.abs(segment)),.001)

def flute_note(pitch,duration):
    source=flute[pitch]
    ratio=len(source)/RATE/duration
    # Pitch-preserving gentle lengthening of real pp flute recordings.
    result=subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ac','1','-ar',str(RATE),'-i','pipe:0','-af',(f'atempo={ratio**.5:.8f},atempo={ratio**.5:.8f}' if ratio<.5 else f'atempo={ratio:.8f}'),'-f','f32le','pipe:1'],input=source.astype('<f4').tobytes())
    return envelope(np.frombuffer(result,dtype='<f4').astype(float),.16,.55)

# Eight spacious 12-second phrases, D major yo pentatonic (D E F# A B).
# No beat track: the rests are part of the piece.
HARMONIES=[['D3','A3','D4','E4','A4'],['B3','Gb4','A4','B4','D5'],['D3','A3','E4','Gb4','B4'],['A3','E4','A4','B4','E5'],['B3','D4','Gb4','A4','D5'],['D3','A3','D4','E4','B4'],['A3','E4','Gb4','A4','B4'],['D3','A3','D4','Gb4','A4']]
for bar,notes in enumerate(HARMONIES):
    base=bar*12
    for j,(offset,index) in enumerate([(0.5,0),(2.15,2),(4.6,3),(7.25,4),(10.0,1)]):
        level=[.145,.10,.084,.078,.065][j]*(.94+rng.random()*.1)
        place(piano[notes[index]],base+offset,level,[-.22,-.12,.15,.23,.05][j])
    if bar in [1,4,6]: place(piano[notes[3]],base+8.8,.046,-.3)

MELODY=[(5.1,69,2.4),(8.1,71,2.8),(16.2,74,2.7),(19.7,71,3.1),(29.0,69,2.5),(32.3,66,3.0),(41.3,69,3.6),(53.0,71,2.5),(56.6,74,3.0),(64.4,76,2.7),(68.0,74,3.1),(77.3,71,2.6),(81.0,69,3.4),(89.1,66,2.3),(92.2,62,2.6)]
for time,pitch,duration in MELODY:
    place(flute_note(pitch,duration),time,.062 if pitch<74 else .052,.07*np.sin(time))

# A soft, original plucked-string colour; a supporting texture, not a sampled koto.
for time,pitch in [(12.5,74),(23.0,69),(36.5,76),(47.5,74),(60.5,71),(72.5,74),(84.5,69)]:
    t=np.arange(int(4*RATE))/RATE;freq=440*2**((pitch-69)/12)
    a=sum((1/(k*k))*np.sin(2*np.pi*freq*k*t+.1*k)*np.exp(-t*(1.5+.35*k)) for k in range(1,7))
    place(envelope(a,.008,.6),time,.022,-.3)

# Very quiet periodic air and a warm D/A bed, with no sampled environmental loops.
t=np.arange(N)/RATE
for pitch,level in [(50,.0017),(57,.0013)]:
    freq=round(440*2**((pitch-69)/12)*SECONDS)/SECONDS
    bed=np.sin(2*np.pi*freq*t)*(1+.13*np.cos(2*np.pi*t/24))
    mix[:,0]+=bed*level;mix[:,1]+=bed*level*.95
noise=rng.normal(0,1,N)
spectrum=np.fft.rfft(noise);frequencies=np.fft.rfftfreq(N,1/RATE)
shape=np.exp(-frequencies/1100)*(1-np.exp(-frequencies/170))
air=np.fft.irfft(spectrum*shape,n=N);air*=.00035/max(np.std(air),.001)
mix[:,0]+=air;mix[:,1]+=np.roll(air,1200)

# Circular stereo room reverb carries the final phrase naturally across the loop.
for channel in range(2):
    length=int(RATE*3.2);tt=np.arange(length)/RATE
    impulse=rng.normal(0,1,length)*np.exp(-tt*2.1)
    impulse=sosfilt(butter(1,3700,fs=RATE,output='sos'),impulse)
    impulse[:int(.04*RATE)]=0
    impulse/=max(np.sqrt(np.sum(impulse**2)),.001)
    wet=np.fft.irfft(np.fft.rfft(mix[:,channel])*np.fft.rfft(impulse,n=N),n=N)
    mix[:,channel]=mix[:,channel]*.82+wet*.25
# Keep a generous headroom before fixed loudness mastering.
mix*=.65/max(np.max(np.abs(mix)),.001)
work=S/'komorebi-mix.wav'
subprocess.run(['ffmpeg','-v','error','-f','f32le','-ar',str(RATE),'-ac','2','-i','pipe:0','-c:a','pcm_s24le','-y',str(work)],input=mix.astype('<f4').tobytes(),check=True)
filter_base='loudnorm=I=-22:TP=-3:LRA=9'
measure=subprocess.run(['ffmpeg','-hide_banner','-i',str(work),'-af',filter_base+':print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
stats=json.JSONDecoder().raw_decode(measure[measure.rfind('{'):])[0]
master=filter_base+f":measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true"
out=ROOT/'public/audio/komorebi-no-negai.mp3'
subprocess.run(['ffmpeg','-v','error','-i',str(work),'-af',master,'-ar',str(RATE),'-c:a','libmp3lame','-b:a','128k','-write_xing','1','-metadata','title=こもれびの願い','-metadata','artist=Yumekana Shrine','-metadata','comment=Original composition; University of Iowa MIS piano/flute recordings used with unrestricted permission.','-y',str(out)],check=True)
manifest={'title':'こもれびの願い','durationSeconds':SECONDS,'sampleRate':RATE,'source':'https://theremin.music.uiowa.edu/MIS.html','permissionQuote':'may be downloaded and used for any projects, without restrictions','sampleSha256':source_hashes,'mastering':stats,'mp3Bytes':out.stat().st_size,'mp3Sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
(ROOT/'public/audio/komorebi-no-negai.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(out),'duration':SECONDS,'bytes':out.stat().st_size,'mastering':stats},ensure_ascii=False))
