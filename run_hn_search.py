#!/usr/bin/env python3
import subprocess, json, time
from pathlib import Path
TODAY='2026-05-02'
topics=[
 'GPT-5.5 OpenAI launch Codex',
 'ARC-AGI-3 GPT-5.5 Opus 4.7',
 'Microsoft Agent 365 AI agents',
 'OpenAI lawsuit Musk Altman Reuters',
 'Google COSMO Gemini Nano Android agent',
 'Recursive Multi-Agent Systems',
 'AI agent coordination research',
 'Structural Jevons Paradox AI energy',
]

def run(topic):
    cmd=['autocli','hackernews','search',topic,'--limit','5','--format','json','--sort','date']
    attempts=0; last=''
    for delay in [0,10,20,30]:
        if delay: time.sleep(delay)
        attempts+=1
        try:
            p=subprocess.run(cmd,capture_output=True,text=True,timeout=30)
        except subprocess.TimeoutExpired:
            last='timeout'
            if attempts<4: continue
            return {'topic':topic,'attempts':attempts,'status':'failed','error':last,'results':[]}
        out=(p.stdout or '').strip(); err=(p.stderr or '').strip(); full=(out+'\n'+err).strip()
        if p.returncode==0:
            try:
                data=json.loads(out) if out else []
            except Exception as e:
                last=f'json parse {e}: {full[:300]}'
                if attempts<4: continue
                return {'topic':topic,'attempts':attempts,'status':'failed','error':last,'results':[]}
            if isinstance(data,dict):
                if isinstance(data.get('results'),list): data=data['results']
                elif isinstance(data.get('items'),list): data=data['items']
                else: data=[data]
            return {'topic':topic,'attempts':attempts,'status':'ok' if data else 'empty','results':data}
        if 'No' in full and 'found' in full:
            return {'topic':topic,'attempts':attempts,'status':'empty','error':full,'results':[]}
        last=full or f'exit {p.returncode}'
        if attempts<4: continue
        return {'topic':topic,'attempts':attempts,'status':'failed','error':last,'results':[]}

results=[]
for i,t in enumerate(topics,1):
    print(f'[{i}/{len(topics)}] {t}', flush=True)
    r=run(t); print(f" -> {r['status']} attempts={r['attempts']} results={len(r.get('results',[]))}", flush=True)
    results.append(r)
    if i!=len(topics): time.sleep(4)
Path(f'logs/raw/{TODAY}-hn-searches.json').write_text(json.dumps(results,indent=2,ensure_ascii=False),encoding='utf-8')
