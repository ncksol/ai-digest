import json,datetime,glob,os,re
BASE='/Users/nick/.openclaw/workspace/ai-digest-site'; DATE='2026-05-18'; SINCE='2026-05-17'; E=1288834974657
now=datetime.datetime.fromisoformat('2026-05-18T07:00:00+00:00')
def num(x):
 if x is None: return 0
 if isinstance(x,str):
  s=x.replace(',','').strip().lower(); mult=1
  if s.endswith('k'): mult=1000; s=s[:-1]
  if s.endswith('m'): mult=1000000; s=s[:-1]
  try:return int(float(s)*mult)
  except:return 0
 return int(x)
byid={}; searches=[]
for fn in [f'{BASE}/logs/{DATE}.searches.ndjson', f'{BASE}/logs/{DATE}.additional.ndjson']:
 for line in open(fn):
  d=json.loads(line); res=d.get('result') if isinstance(d.get('result'),list) else []
  searches.append({'query':d['query'],'ok':d.get('ok',False),'returned_count':len(res)})
  for t in res:
   tid=str(t.get('id') or '');
   if not tid: continue
   dt=datetime.datetime.fromtimestamp(((int(tid)>>22)+E)/1000, datetime.timezone.utc); age=(now-dt).total_seconds()/3600
   if 0<=age<=24: byid[tid]={**t,'derived_timestamp':dt.isoformat().replace('+00:00','Z'),'age_hours':age,'author_norm':str(t.get('author') or t.get('username') or '').lstrip('@'),'text_norm':(t.get('text') or '').strip()}
def mk(tid,cat,reason,fp,role,src='scheduled_search'):
 t=byid[tid]; a=t['author_norm'];
 return {'id':'item_'+tid,'tweet_id':tid,'author':a,'text':t['text_norm'],'url':f'https://xcancel.com/{a}/status/{tid}','derived_timestamp':t['derived_timestamp'],'age_hours':round(t['age_hours'],2),'replies':num(t.get('replies')),'retweets':num(t.get('retweets')),'likes':num(t.get('likes')),'views':num(t.get('views')) if t.get('views') is not None else None,'category':cat,'selection_reason':reason,'story_fingerprint':fp,'pool_role':role,'candidate_source':src,'promoted_from_reserve':False,'cycle_introduced':2 if src=='additional_search' else 1,'replacement_for':None,'replacement_source':'additional_search' if src=='additional_search' else None}
selected_specs=[
('2056165722804654196','news','Official OpenAI CEO post gives concrete ChatGPT Images 2.0 India usage metric.','chatgpt-images-india-billion','scheduled_search'),
('2056214387980193909','practitioner','Karpathy gives concrete training-resource constraint for nanochat educational material.','nanochat-8xh100-access','scheduled_search'),
('2056218976913694879','analysis','Practitioner post gives concrete claim about H100 scarcity and research access pressure.','gpu-shortage-academic-access','scheduled_search'),
('2055969356127899668','analysis','Technical post links LLM agent delusion mitigation to causality and agency.','agent-delusion-causality','scheduled_search'),
('2056254810286956781','practitioner','Practitioner reports a concrete hallucination regression in Perplexity despite source crawling.','perplexity-hallucination-regression','scheduled_search'),
('2056089834532241667','analysis','Practitioner analysis contrasts open-source model risk with blind execution risk in production AI.','open-source-production-risk','scheduled_search'),
('2056223743446245519','practitioner','OpenAI president gives concrete Codex use case around unsubscribing from marketing email.','codex-unsubscribe-email','scheduled_search'),
('2055925035618160824','research','Research-focused tweet describes a Google DeepMind paper on web environments as an AI-agent security attack surface.','deepmind-web-agent-security','additional_search')]
reserve_specs=[
('2056226569555710153','research','Closer-to-specific GenCAD tweet but engagement is negligible.','gencad-photo-cad','additional_search'),
('2056022182560665602','news','Higher-engagement Claude Code plugin claim but remains secondary source.','claude-code-setup-plugin','additional_search'),
('2056179413901877551','analysis','Very high engagement but question-style item is less concrete than selected candidates.','ai-forecast-question','scheduled_search'),
('2056061134629933072','news','High engagement but tweet text is too sparse without thread context.','grok-upgrades','scheduled_search'),
('2056077523239502061','news','Open-source AI studio claim is concrete but promotional and less traceable.','open-source-ai-studio-200-models','scheduled_search')]
selected=[mk(x[0],x[1],x[2],x[3],'selected',x[4]) for x in selected_specs]
reserve=[mk(x[0],x[1],x[2],x[3],'reserve',x[4]) for x in reserve_specs if x[0] in byid]
recent=[]
for f in sorted(glob.glob(f'{BASE}/digests/*.md'))[-7:]: recent.append({'file':os.path.basename(f),'headlines':re.findall(r'^## (.+)$',open(f).read(),re.M)})
packet={'schema_version':'twitter_ai_digest_editor_input.v1','date':DATE,'since_date':SINCE,'editor_cycle':2,'selection_target':{'normal_min':10,'normal_max':16},'searches':searches,'recent_history':recent,'tweet_pool':selected+reserve,'selected_items':selected,'rejected_notable_items':reserve,'selection_criteria':{'source_rules':'autocli twitter search only; all items require concrete tweets and xcancel URLs','cycle_2_reason':'Applied editor cycle 1 decisions: removed weak secondary CAD, Claude plugin and abstract agent-stack items; added DeepMind agent-security paper tweet from additional Twitter search.','quality':'publish best strong set rather than weak filler.'}}
open(f'{BASE}/logs/{DATE}.editor-cycle-2.input.json','w').write(json.dumps(packet,indent=2)+'\n')
# update daily log selected/rejected
log=json.load(open(f'{BASE}/logs/{DATE}.json')); log['editor_cycle_1']='applied'; log['selected_items']=[{'id':i['id'],'tweet_id':i['tweet_id'],'author':i['author'],'category':i['category'],'reason':i['selection_reason']} for i in selected]; log['rejected_notable_items']=[{'id':i['id'],'tweet_id':i['tweet_id'],'author':i['author'],'category':i['category'],'exclusion_reason':i['selection_reason']} for i in reserve]
open(f'{BASE}/logs/{DATE}.json','w').write(json.dumps(log,indent=2)+'\n')
