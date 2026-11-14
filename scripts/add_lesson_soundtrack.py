"""Original ambient score and narration mixes. AI-assisted by OpenAI Codex.

Uses Python's standard library and the already installed imageio-ffmpeg.
No voice generation, video re-encoding or third-party music. Original narration
is retained in site/videos/*.voice.m4a and the existing source recordings.
"""
import array
import json
import math
import re
import subprocess
import wave
from pathlib import Path
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / '.qa' / 'audio'
QA.mkdir(parents=True, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
RATE = 22050
SCORE = QA / 'original-score.wav'

def run(args):
    r = subprocess.run([FF, '-hide_banner', '-y', *map(str, args)], capture_output=True, text=True, check=True)
    return r.stderr

def info(path):
    r = subprocess.run([FF, '-hide_banner', '-i', str(path)], capture_output=True, text=True)
    text = r.stderr
    m = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', text)
    return sum(float(x)*w for x,w in zip(m.groups(),[3600,60,1]))

def compose(seconds=85):
    # D major add9, B minor7, G major add9, A suspended. Long crossfades, no drums.
    chords = [(146.832,220.0,277.183,329.628), (123.471,185.0,220.0,293.665),
              (97.999,146.832,220.0,246.942), (110.0,164.814,220.0,293.665)]
    stereo = array.array('f')
    for i in range(int(seconds*RATE)):
        t = i/RATE
        v = [0.0,0.0]
        for j,chord in enumerate(chords):
            start=j*20-3
            e=max(0.0,min(1.0,(t-start)/5))*max(0.0,min(1.0,(start+26-t)/6))
            if e<=0: continue
            e=e*e*(3-2*e)
            for k,f in enumerate(chord):
                drift=0.10*math.sin(t*.21+k)
                note=math.sin(math.tau*f*t+drift)*.09+math.sin(math.tau*f*2.001*t)*.012
                pan=.30+.40*((j+k)%4)/3
                v[0]+=note*e*(1-pan);v[1]+=note*e*pan
        # Sparse soft bell, one note every four seconds, softened attack.
        beat=int(t/4);u=t%4
        pitch=[587.330,659.255,440.0,493.883,739.989,659.255,493.883,440.0][beat%8]
        env=(1-math.exp(-u*5))*math.exp(-u*1.3)
        bell=.018*env*(math.sin(math.tau*pitch*t)+.15*math.sin(math.tau*pitch*2*t))
        fade=min(1,t/4,max(0,(seconds-t)/5))
        stereo.extend([(v[0]+bell)*fade,(v[1]+bell*.8)*fade])
    rms=math.sqrt(sum(x*x for x in stereo)/len(stereo));gain=.045/rms
    pcm=array.array('h',(round(max(-.8,min(.8,x*gain))*32767) for x in stereo))
    with wave.open(str(SCORE),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
    return {'score_seconds':seconds,'raw_rms_dbfs':20*math.log10(.045),'peak_dbfs':20*math.log10(max(abs(x) for x in pcm)/32767)}

if __name__=='__main__':
    report={'composition':compose(),'mixes':[],'generated_by':'OpenAI Codex; deterministic original synthesizer score'}
    for number in range(1,7):
        vid=ROOT/'site'/'videos'/f'1-{number}.mp4'
        voice=vid.with_suffix('.voice.m4a')
        if not voice.exists():
            run(['-i',vid,'-vn','-c:a','copy','-metadata','comment=Original lesson narration; AI voice credited in docs/ai-usage-log.md',voice])
        duration=info(vid)
        # The immutable voice copy is used on reruns, so music is never mixed onto an earlier music mix.
        temporary=QA/f'1-{number}.mixed.mp4'
        mix=(f'[1:a]asplit=2[narr][det];[2:a]volume=0.60,afade=t=in:d=3,'
             f'afade=t=out:st={max(0,duration-4):.3f}:d=4[music];'
             '[music][det]sidechaincompress=threshold=0.035:ratio=3:attack=50:release=600[duck];'
             '[narr][duck]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95:level=false[mix]')
        run(['-i',vid,'-i',voice,'-i',SCORE,'-filter_complex',mix,'-map','0:v:0','-map','[mix]',
             '-c:v','copy','-c:a','aac','-b:a','160k','-t',f'{duration:.3f}','-movflags','+faststart',
             '-metadata','comment=AI-assisted original instrumental soundtrack composed with OpenAI Codex. Original narration credited to ElevenLabs. See docs/ai-usage-log.md.',temporary])
        volume=run(['-i',temporary,'-vn','-af','volumedetect','-f','null','NUL'])
        peaks=re.findall(r'(mean_volume|max_volume): ([\-\d.]+) dB',volume)
        # A decoded video hash must stay identical: only the audio track is changed.
        original_hash=run(['-i',vid,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256',QA/'before.hash'])
        run(['-i',temporary,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256',QA/'after.hash'])
        assert (QA/'before.hash').read_text()==(QA/'after.hash').read_text(),'Video stream changed'
        temporary.replace(vid)
        report['mixes'].append({'video':vid.name,'duration':duration,'audio_levels_dbfs':dict(peaks),'video_stream_unchanged':True})
        print(f'Mixed {vid.name}: {duration:.2f}s, {dict(peaks)}',flush=True)
    (QA/'soundtrack-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
