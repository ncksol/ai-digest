#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const date = process.argv[2];
if (!date) throw new Error('usage: build-daily-log.mjs YYYY-MM-DD');
const root = path.resolve(import.meta.dirname, '..');
const rawDir = path.join(root, 'logs', `${date}.raw`);
const out = path.join(root, 'logs', `${date}.json`);
const nowMs = Date.parse(`${date}T09:51:00Z`);
const queries = [
  'AI since:2026-09-03', 'LLM since:2026-09-03', 'machine learning since:2026-09-03',
  'GPT OR Claude OR Gemini since:2026-09-03', 'open source AI model since:2026-09-03',
  'AI agent since:2026-09-03', 'Sam Altman since:2026-09-03', 'Dario Amodei since:2026-09-03',
  'Demis Hassabis since:2026-09-03', 'from:karpathy since:2026-09-03', 'from:sama since:2026-09-03',
  'from:OpenAI since:2026-09-03', 'from:AnthropicAI since:2026-09-03'
];
const byId = new Map();
const searches = queries.map((query, i) => {
  const file = path.join(rawDir, `search-${i + 1}.json`);
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const row of rows) byId.set(String(row.id), row);
  return {query, limit: i < 9 ? 20 : 5, status: 'ok', returned: rows.length};
});
const selectedMeta = new Map(Object.entries({
  '2095595741528125780':['product_release','OpenAI launched GPT-6 Astra as a fast general computer-use model; strongest self-contained OpenAI post.'],
  '2095600005772104059':['company_statement','Sam Altman framed Astra around entrepreneurship, science, coding and professional work; strongest self-contained sama post.'],
  '2095595752815030713':['benchmarks','OpenAI reported state-of-the-art results across maths, agents, science and health benchmarks.'],
  '2095595489031000350':['technical_analysis','Artificial Analysis supplied independent cost, token-efficiency and benchmark detail.'],
  '2095596175705399482':['practitioner_story','A practitioner reported an Astra-built Unreal world populated by collaborating agents that began speaking to one another.'],
  '2095723177389232540':['technical_analysis','A practitioner documented a manager-and-implementer loop for improving long-horizon Astra work.'],
  '2095497035806113861':['open_source_release','IFM released six open models from 0.9B to 375B with code, data and training recipes.'],
  '2095598736265404631':['practitioner_analysis','A former frontier-lab worker reported more modest productivity gains and substantial wasted time from LLM use.'],
  '2095590088390656262':['practitioner_analysis','A former frontier-lab worker said direct exposure made his AGI timeline more bearish.'],
  '2095585213271408978':['policy','Mark Zuckerberg told President Trump he opposed a national AI regulator.'],
  '2095570359059988584':['research','Martian reported a model-routing method with 46 per cent fewer errors than the best single LLM across 16 benchmarks.'],
  '2095509618533228685':['policy','Channel 4 quoted Altman predicting children will not be smarter than AI and urging governments to adopt the technology.'],
  '2095717465867395520':['industry_analysis','Altman revised his 2023 expectation of rapid software displacement, citing economic inertia.'],
  '2095534784734716405':['practitioner_story','A SpaceXAI engineer described a 20-plus-agent GrokBot hierarchy with chief-of-staff and project-manager roles.'],
  '2095518303422955762':['company_move','A post analysed Nvidia acquisition of Hugging Face as control of AI model distribution and discovery.'],
  '2095542341956428129':['research','A researcher connected rumoured Astra architecture to published scaling-law work on looped transformers.']
}));
const reserveReasons = new Map(Object.entries({
  '2095597213896610184':'Reserve cost-efficiency interpretation overlaps the stronger Artificial Analysis item.',
  '2095688272269984016':'Reserve visual comparison overlaps Astra capability coverage.',
  '2095621785953984782':'Reserve practitioner reaction is less concrete than selected Astra demonstrations.',
  '2095601101701820752':'Reserve benchmark reaction lacks enough technical detail.',
  '2095680589043220778':'Context-dependent rollout reply; not selected because the self-contained sama launch post is stronger.',
  '2095678759651438887':'Discovered as parent context rather than a primary search result; reserve rollout update.',
  '2095703898044428545':'Reserve policy quote has weak engagement and secondary framing.',
  '2095690788785025208':'Reserve cyber-policy quote overlaps recent Astra safety coverage.',
  '2095549746605629775':'Humorous demonstration is less substantive than selected practitioner items.',
  '2095528411741536376':'High engagement but too little information to support a digest item.'
}));
function derived(id) {
  const ms = Number((BigInt(id) >> 22n) + 1288834974657n);
  return {derived_timestamp: new Date(ms).toISOString(), age_hours: Math.round(((nowMs - ms) / 3600000) * 100) / 100};
}
function threadRoot(id) {
  const f = path.join(rawDir, 'threads', `${id}.json`);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8')).find(x => String(x.id) === id) ?? null;
}
function normalise(row) {
  const id = String(row.id);
  const expanded = threadRoot(id);
  const source = expanded ?? row;
  return {id, author: source.author, text: source.text ?? '', likes: row.likes ?? source.likes ?? 0, replies: row.replies ?? source.replies ?? 0, retweets: row.retweets ?? source.retweets ?? 0, views: row.views ?? source.views ?? 0, url: `https://x.com/${source.author}/status/${id}`, ...derived(id)};
}
const tweets = [...byId.values()].map(normalise).sort((a,b) => b.id.localeCompare(a.id));
function contextFields(id) {
  if (id === '2095680433916911813') return {is_self_contained:false,is_reply:true,context_tweet_ids:['2095678759651438887','2095679547114999952'],context_summary:'Altman said Astra rollout was messy and broad access would begin soon; a Pro subscriber asked whether to stay awake, and Altman replied to go to bed.',context_retrieval_status:'success'};
  if (id === '2095601442220638547') return {is_self_contained:false,is_reply:false,context_tweet_ids:['2095527557924082061'],context_summary:'Altman referred to OpenAI’s Astra launch film as his favourite company video.',context_retrieval_status:'partial_media_only'};
  if (id === '2095731348996821200') return {is_self_contained:false,is_reply:true,context_tweet_ids:[],context_summary:'Thread lookup returned the reply text but not its parent; the surrounding replies indicate Azure customer access to Astra.',context_retrieval_status:'partial_parent_missing'};
  if (id === '2095527557924082061') return {is_self_contained:false,is_reply:false,context_tweet_ids:[],context_summary:'Media-only OpenAI launch post; thread lookup recovered only the short link and replies.',context_retrieval_status:'partial_media_only'};
  return {is_self_contained:true,is_reply:false,context_tweet_ids:[],context_summary:null,context_retrieval_status:'not_needed'};
}
const specialIds = new Set(['2095600005772104059','2095601442220638547','2095680433916911813','2095731348996821200','2095595752815030713','2095595742975197690','2095595748528452037','2095595757072191802','2095527557924082061']);
for (const t of tweets) if (specialIds.has(t.id)) Object.assign(t, contextFields(t.id));
const selected_items = tweets.filter(t => selectedMeta.has(t.id)).map(t => ({...t, category:selectedMeta.get(t.id)[0], selection_reason:selectedMeta.get(t.id)[1]}));
const rejected_notable_items = tweets.filter(t => reserveReasons.has(t.id)).map(t => ({...t, category:'reserve', exclusion_reason:reserveReasons.get(t.id)}));
const log = {date, generated_at:new Date().toISOString(), searches, tweets, selected_items, rejected_notable_items, notes:['Twitter discovery only via sequential autocli searches.','Replies values preserved from search output; targeted thread lookups do not expose replies counts.']};
fs.writeFileSync(out, JSON.stringify(log, null, 2) + '\n');
console.log(`${out}: ${tweets.length} tweets, ${selected_items.length} selected, ${rejected_notable_items.length} reserves`);
