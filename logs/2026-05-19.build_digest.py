import json, glob, datetime, re
from pathlib import Path
DATE='2026-05-19'; SINCE='2026-05-18'
now=datetime.datetime(2026,5,19,7,0,tzinfo=datetime.timezone.utc)
selected_ids=['2056435834333934051','2056419620643541012','2056531492080435452','2056389715293778192','2056307663634612373','2056512380050555196','2056426411695423823','2056606327984787932','2056614053066248428','2056565262632255615']
reserve_ids=['2056441544660398181','2056362875195686927','2056363364020817949','2056448196629680214','2056433610228457908','2056594968295178412','2056560635945922920']
cat={
'2056435834333934051':'product update','2056419620643541012':'company move','2056531492080435452':'research/product milestone','2056389715293778192':'practitioner analysis','2056307663634612373':'open-source education','2056512380050555196':'company/workforce','2056426411695423823':'industry analysis','2056606327984787932':'company/investment','2056614053066248428':'industry commentary','2056565262632255615':'open-source tooling',
'2056441544660398181':'ai in education','2056362875195686927':'developer tooling','2056363364020817949':'labor market analysis','2056448196629680214':'legal/company','2056433610228457908':'legal/company','2056594968295178412':'research paper','2056560635945922920':'technical analysis'}
reason={k:'Concrete tweet with measurable engagement and a distinct AI/ML angle from the last 24 hours.' for k in cat}
finger={
'2056435834333934051':'chatgpt-latest-update-altman','2056419620643541012':'anthropic-acquires-stainlessapi','2056531492080435452':'alphafold-locked-in-demis','2056389715293778192':'llm-out-of-distribution-behavior','2056307663634612373':'train-llm-from-scratch-notebook','2056512380050555196':'meta-ai-reorg-layoff-memo','2056426411695423823':'cursor-training-own-models','2056606327984787932':'demis-anthropic-angel-investor','2056614053066248428':'anthropic-code-written-by-ai-claim','2056565262632255615':'gbrain-longmemeval-oss-memory',
'2056441544660398181':'ai-graduation-name-announcement-failure','2056362875195686927':'claude-code-prompt-video','2056363364020817949':'dario-ai-gdp-unemployment','2056448196629680214':'musk-openai-lawsuit-dismissed','2056433610228457908':'musk-openai-lawsuit-dismissed','2056594968295178412':'steered-llm-activations-non-surjective','2056560635945922920':'finetuning-impressive-fragile'}
tweets={}
all_returned=[]
for f in glob.glob(f'logs/{DATE}.search-*.json'):
    try: data=json.load(open(f))
    except: continue
    if isinstance(data,dict): data=data.get('tweets') or data.get('data') or [data]
    for t in data:
        if not isinstance(t,dict) or 'id' not in t: continue
        tid=str(t['id']); ts=datetime.datetime.fromtimestamp(((int(tid)>>22)+1288834974657)/1000, tz=datetime.timezone.utc)
        age=(now-ts).total_seconds()/3600
        rec={k:t.get(k) for k in ['id','author','text','likes','replies','retweets','views','url']}
        rec['derived_timestamp']=ts.isoformat().replace('+00:00','Z'); rec['age_hours']=age
        all_returned.append(rec)
        if tid not in tweets and age<=24: tweets[tid]=t|{'derived_timestamp':rec['derived_timestamp'],'age_hours':age}

def item(tid, role):
    t=tweets[tid]; a=t.get('author') or t.get('username'); url=f'https://xcancel.com/{a}/status/{tid}'
    return {'id':'item_'+tid,'tweet_id':tid,'author':a,'text':t.get('text',''),'url':url,'derived_timestamp':t['derived_timestamp'],'age_hours':round(t['age_hours'],2),'replies':int(t.get('replies') or 0),'retweets':int(t.get('retweets') or 0),'likes':int(t.get('likes') or 0),'views':t.get('views') if t.get('views') is None else int(t.get('views') or 0),'category':cat[tid],'selection_reason':reason[tid],'story_fingerprint':finger[tid],'pool_role':role,'candidate_source':'autocli twitter search','promoted_from_reserve':False,'cycle_introduced':1,'replacement_for':None,'replacement_source':None}
selected=[item(t,'selected') for t in selected_ids if t in tweets]
reserve=[item(t,'reserve') for t in reserve_ids if t in tweets]
packet={'schema_version':'twitter_ai_digest_editor_input.v1','date':DATE,'since_date':SINCE,'editor_cycle':1,'selection_target':{'normal_min':10,'normal_max':16},'searches':[{'idx':i+1,'query':q,'ok':True,'out':f'logs/{DATE}.search-{i+1}.json'} for i,q in enumerate(['AI since:2026-05-18','LLM since:2026-05-18','machine learning since:2026-05-18','GPT OR Claude OR Gemini since:2026-05-18','open source AI model since:2026-05-18','AI agent since:2026-05-18','Sam Altman since:2026-05-18','Dario Amodei since:2026-05-18','Demis Hassabis since:2026-05-18','from:karpathy since:2026-05-18','from:sama since:2026-05-18','from:OpenAI since:2026-05-18','from:AnthropicAI since:2026-05-18'])],'recent_history':[{'file':p.name,'summary':'; '.join(re.findall(r'^## (.+)$',p.read_text(),re.M)[:8])} for p in sorted(Path('digests').glob('*.md'))[-7:]],'tweet_pool':selected+reserve,'selected_items':selected,'rejected_notable_items':reserve,'selection_criteria':{'rules':['24-hour snowflake window','deduplicate by tweet and story','cap single author at one to two items','prioritize concrete news releases company moves practitioner analysis and technical analysis','omit weak filler and non-events']}}
Path(f'logs/{DATE}.editor-cycle-1.input.json').write_text(json.dumps(packet,indent=2)+'\n')
log={'date':DATE,'searches':packet['searches'],'all_returned_tweets':all_returned,'selected_items':selected,'rejected_notable_items':[{**r,'exclusion_reason':'Reserve candidate for editor review or lower priority than selected set.'} for r in reserve]}
Path(f'logs/{DATE}.json').write_text(json.dumps(log,indent=2)+'\n')
print(len(selected),len(reserve))
