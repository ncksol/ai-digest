#!/usr/bin/env python3
import json, datetime, re
from pathlib import Path
TODAY='2026-05-02'
now=datetime.datetime(2026,5,2,7,19,tzinfo=datetime.timezone.utc)
cutoff=now-datetime.timedelta(hours=24)
raw=json.loads(Path(f'logs/raw/{TODAY}-twitter-searches.json').read_text())
seen={}
searches=[]
rejected=[]

def sf_ts(tid):
    ms=(int(str(tid)) >> 22) + 1288834974657
    return datetime.datetime.fromtimestamp(ms/1000,tz=datetime.timezone.utc)

def handle(a):
    return a if str(a).startswith('@') else '@'+str(a)

for sr in raw:
    tws=[]
    for t in sr.get('tweets',[]):
        tid=str(t.get('id',''))
        ts=sf_ts(tid) if tid.isdigit() else None
        age=(now-ts).total_seconds()/3600 if ts else None
        item={
            'id': tid,
            'author': handle(t.get('author','')),
            'text': (t.get('text') or '')[:200],
            'likes': int(t.get('likes') or 0),
            'views': int(t.get('views') or 0),
            'derived_timestamp': ts.isoformat().replace('+00:00','Z') if ts else None,
            'age_hours': round(age,2) if age is not None else None,
        }
        tws.append(item)
        if age is not None and age>24:
            rejected.append({**item,'reason':'older than 24h'})
        elif tid and tid not in seen:
            seen[tid]={**item,'full_text':t.get('text') or '', 'engagement':int(t.get('likes') or 0)+int(t.get('views') or 0), 'url':t.get('url')}
    searches.append({'query':sr['query'],'resultCount':len(sr.get('tweets',[])),'attempts':sr['attempts'],'status':sr['status'],'tweets':tws})

# watched/multi-author cap: keep top 1 default, 2 only if useful different/high signal
by_author={}
for tid,t in seen.items(): by_author.setdefault(t['author'],[]).append(t)
kept={}
for author,items in by_author.items():
    items=sorted(items,key=lambda x:x['engagement'],reverse=True)
    keep_n=1
    if len(items)>=2:
        # keep 2 if second has at least 20k views or obvious news/research terms
        second=items[1]
        if second['views']>=20000 or re.search(r'launch|released|paper|research|model|Agent|GPT|Claude|Gemini|OpenAI|DeepMind|Microsoft|Dario|Altman', second['full_text'], re.I):
            keep_n=2
    for t in items[:keep_n]: kept[t['id']]=t
    for t in items[keep_n:]: rejected.append({k:t[k] for k in ['id','author','text','likes','views','derived_timestamp','age_hours']} | {'reason':'watched-account cap'})

ranked=sorted(kept.values(), key=lambda x:x['engagement'], reverse=True)
for t in ranked:
    print(f"{t['engagement']:>9} {t['author']} {t['id']} age={t['age_hours']} {t['full_text'][:120].replace(chr(10),' ')}")

Path(f'logs/raw/{TODAY}-processed_candidates.json').write_text(json.dumps({'ranked':ranked,'rejected':rejected,'searches':searches},indent=2,ensure_ascii=False))
