#!/usr/bin/env python3
import subprocess, json, time, sys, datetime, os
from pathlib import Path

TODAY='2026-05-02'
SINCE='2026-05-01'
queries = [
    f'AI since:{SINCE}',
    f'LLM since:{SINCE}',
    f'machine learning since:{SINCE}',
    f'GPT OR Claude OR Gemini since:{SINCE}',
    f'open source AI model since:{SINCE}',
    f'AI agent since:{SINCE}',
    f'Sam Altman since:{SINCE}',
    f'Dario Amodei since:{SINCE}',
    f'Demis Hassabis since:{SINCE}',
    f'from:karpathy since:{SINCE}',
    f'from:sama since:{SINCE}',
    f'from:OpenAI since:{SINCE}',
    f'from:AnthropicAI since:{SINCE}',
]
limits = [20,20,20,20,20,20,20,20,20,5,5,5,5]

def snowflake_ts(tweet_id):
    ms = (int(str(tweet_id)) >> 22) + 1288834974657
    return datetime.datetime.fromtimestamp(ms/1000, tz=datetime.timezone.utc)

def run_search(q, limit):
    cmd=['autocli','twitter','search',q,'--limit',str(limit),'--format','json']
    attempts=0
    last_err=''
    for i, delay in enumerate([0,10,20,30]):
        if delay:
            time.sleep(delay)
        attempts += 1
        try:
            p = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        except subprocess.TimeoutExpired as e:
            last_err='timeout'
            if attempts < 4:
                continue
            return {'query':q,'attempts':attempts,'status':'failed','error':last_err,'tweets':[]}
        out=(p.stdout or '').strip()
        err=(p.stderr or '').strip()
        if p.returncode == 0:
            try:
                data=json.loads(out) if out else []
            except Exception as ex:
                last_err=f'json parse error: {ex}; stdout={out[:300]}; stderr={err[:300]}'
                if attempts < 4:
                    continue
                return {'query':q,'attempts':attempts,'status':'failed','error':last_err,'tweets':[]}
            if isinstance(data, dict):
                if 'tweets' in data and isinstance(data['tweets'], list): data=data['tweets']
                elif 'results' in data and isinstance(data['results'], list): data=data['results']
                else: data=[data]
            status='ok' if len(data)>0 else 'empty'
            return {'query':q,'attempts':attempts,'status':status,'tweets':data}
        else:
            full=(out+'\n'+err).strip()
            if 'No tweets found' in full:
                return {'query':q,'attempts':attempts,'status':'empty','error':full,'tweets':[]}
            last_err=full or f'exit {p.returncode}'
            if attempts < 4:
                continue
            return {'query':q,'attempts':attempts,'status':'failed','error':last_err,'tweets':[]}

results=[]
for idx,(q,l) in enumerate(zip(queries,limits),1):
    print(f'[{idx}/{len(queries)}] {q}', flush=True)
    r=run_search(q,l)
    print(f"  -> {r['status']} attempts={r['attempts']} tweets={len(r.get('tweets',[]))}", flush=True)
    results.append(r)
    if idx != len(queries):
        time.sleep(4)

Path('logs/raw').mkdir(parents=True, exist_ok=True)
Path(f'logs/raw/{TODAY}-twitter-searches.json').write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding='utf-8')
failed=sum(1 for r in results if r['status']=='failed')
print(f'FAILED={failed} of {len(results)}', flush=True)
if failed > len(results)//2:
    sys.exit(2)
