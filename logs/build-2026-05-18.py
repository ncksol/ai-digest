import json,glob,os,re,datetime
BASE='/Users/nick/.openclaw/workspace/ai-digest-site'
DATE='2026-05-18'; SINCE='2026-05-17'; E=1288834974657
now=datetime.datetime.fromisoformat('2026-05-18T07:00:00+00:00')
raw=[]; byid={}; searches=[]
for line in open(f'{BASE}/logs/{DATE}.searches.ndjson'):
 d=json.loads(line); res=d.get('result') if isinstance(d.get('result'),list) else []
 searches.append({'query':d['query'],'ok':d.get('ok',False),'returned_count':len(res)})
 for t in res:
  tid=str(t.get('id') or '')
  if not tid: continue
  ms=(int(tid)>>22)+E; dt=datetime.datetime.fromtimestamp(ms/1000, datetime.timezone.utc); age=(now-dt).total_seconds()/3600
  author=str(t.get('username') or t.get('author') or t.get('handle') or '').lstrip('@')
  item={**t,'derived_timestamp':dt.isoformat().replace('+00:00','Z'),'age_hours':age,'author_norm':author,'text_norm':(t.get('text') or t.get('content') or '').strip()}
  raw.append(item)
  if 0<=age<=24: byid[tid]=item

def num(x):
 if x is None: return 0
 if isinstance(x,str):
  s=x.replace(',','').strip().lower(); mult=1
  if s.endswith('k'): mult=1000; s=s[:-1]
  if s.endswith('m'): mult=1000000; s=s[:-1]
  try: return int(float(s)*mult)
  except: return 0
 return int(x)
def mk(tid,cat,reason,fp,role):
 t=byid[tid]; a=t['author_norm']; text=t['text_norm']
 return {'id':'item_'+tid,'tweet_id':tid,'author':a,'text':text,'url':f'https://xcancel.com/{a}/status/{tid}','derived_timestamp':t['derived_timestamp'],'age_hours':round(t['age_hours'],2),'replies':num(t.get('replies')),'retweets':num(t.get('retweets')),'likes':num(t.get('likes')),'views':num(t.get('views')) if t.get('views') is not None else None,'category':cat,'selection_reason':reason,'story_fingerprint':fp,'pool_role':role,'candidate_source':'scheduled_search','promoted_from_reserve':False,'cycle_introduced':1,'replacement_for':None,'replacement_source':None}
selected_ids=[
('2056165722804654196','news','Official OpenAI CEO post gives concrete ChatGPT Images 2.0 India usage metric.','chatgpt-images-india-billion'),
('2056214387980193909','practitioner','Karpathy gives concrete training-resource constraint for nanochat educational material.','nanochat-8xh100-access'),
('2056218976913694879','analysis','Practitioner post gives concrete claim about H100 scarcity and research access pressure.','gpu-shortage-academic-access'),
('2055949207165677844','news','High-engagement tweet describes an open-source MIT photo-to-CAD model release.','mit-photo-to-cad-model'),
('2056081357374378410','news','Concrete Anthropic Claude Code setup plugin claim with tool recommendations.','claude-code-setup-plugin'),
('2055969356127899668','analysis','Technical post links LLM agent delusion mitigation to causality and agency.','agent-delusion-causality'),
('2056254810286956781','practitioner','Practitioner reports a concrete hallucination regression in Perplexity despite source crawling.','perplexity-hallucination-regression'),
('2056089834532241667','analysis','Practitioner analysis contrasts open-source model risk with blind execution risk in production AI.','open-source-production-risk'),
('2055917811852034179','analysis','Practitioner maps the progression from LLMs to harnesses, agents, swarms, orchestrators, and protocols.','agent-stack-progression'),
('2056223743446245519','practitioner','OpenAI president gives concrete Codex use case around unsubscribing from marketing email.','codex-unsubscribe-email')]
reserve_ids=[
('2056179413901877551','analysis','Very high engagement but question-style item is less concrete than selected candidates.','ai-forecast-question'),
('2056061134629933072','news','High engagement but tweet text is too sparse without thread context.','grok-upgrades'),
('2056030457959952525','news','High engagement but model-release timing claim is unverified and broad.','next-week-model-rumours'),
('2056193324365512801','analysis','High engagement but mostly meta commentary rather than new AI event.','ai-prophetic-tweet-meta'),
('2056062188821877218','analysis','Altman AGI quote is concrete but secondary and less useful than selected items.','altman-agi-rorschach'),
('2055919204591902771','research','Likely duplicate of recent digest item about LLM-agent memory reliability.','llm-agent-memory-reliability'),
('2056077523239502061','news','Open-source AI studio claim is concrete but promotional and less traceable.','open-source-ai-studio-200-models')]
selected=[mk(*x,role='selected') for x in selected_ids]
reserve=[mk(*x,role='reserve') for x in reserve_ids]
# recent history summaries
recent=[]
for f in sorted(glob.glob(f'{BASE}/digests/*.md'))[-7:]:
 txt=open(f).read(); heads=re.findall(r'^## (.+)$', txt, re.M)
 recent.append({'file':os.path.basename(f),'headlines':heads})
packet={'schema_version':'twitter_ai_digest_editor_input.v1','date':DATE,'since_date':SINCE,'editor_cycle':1,'selection_target':{'normal_min':10,'normal_max':16},'searches':searches,'recent_history':recent,'tweet_pool':selected+reserve,'selected_items':selected,'rejected_notable_items':reserve,'selection_criteria':{'source_rules':'autocli twitter search only; all items require concrete tweets and xcancel URLs','time_filter':'snowflake-derived timestamp within 24 hours of 2026-05-18T07:00:00Z','author_cap':'1-2 items per author, strongest distinct items only','quality':'prioritise concrete news, releases, practitioner observations, technical analysis; avoid stale repeats and weak filler'}}
open(f'{BASE}/logs/{DATE}.editor-cycle-1.input.json','w').write(json.dumps(packet,indent=2)+'\n')
# structured log
all_tweets=[]
seen=set()
for t in raw:
 tid=str(t.get('id') or '')
 if tid in seen: continue
 seen.add(tid)
 all_tweets.append({'id':tid,'author':t['author_norm'],'text':t['text_norm'],'likes':num(t.get('likes')),'replies':num(t.get('replies')),'retweets':num(t.get('retweets')),'views':num(t.get('views')) if t.get('views') is not None else None,'derived_timestamp':t['derived_timestamp'],'age_hours':round(t['age_hours'],2)})
log={'date':DATE,'searches':searches,'tweets':all_tweets,'selected_items':[{'id':i['id'],'tweet_id':i['tweet_id'],'author':i['author'],'category':i['category'],'reason':i['selection_reason']} for i in selected],'rejected_notable_items':[{'id':i['id'],'tweet_id':i['tweet_id'],'author':i['author'],'category':i['category'],'exclusion_reason':i['selection_reason']} for i in reserve]}
open(f'{BASE}/logs/{DATE}.json','w').write(json.dumps(log,indent=2)+'\n')
