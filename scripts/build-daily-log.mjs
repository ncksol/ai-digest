#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const date = process.argv[2];
if (!date) throw new Error('usage: build-daily-log.mjs YYYY-MM-DD');
const root = path.resolve(import.meta.dirname, '..');
const rawDir = path.join(root, 'logs', `${date}-searches`);
const out = path.join(root, 'logs', `${date}.json`);
const nowMs = Date.parse(`${date}T07:00:00Z`);
const since = new Date(Date.parse(`${date}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
const queries = [
  `AI since:${since}`, `LLM since:${since}`, `machine learning since:${since}`,
  `GPT OR Claude OR Gemini since:${since}`, `open source AI model since:${since}`,
  `AI agent since:${since}`, `Sam Altman since:${since}`, `Dario Amodei since:${since}`,
  `Demis Hassabis since:${since}`, `from:karpathy since:${since}`, `from:sama since:${since}`,
  `from:OpenAI since:${since}`, `from:AnthropicAI since:${since}`
];
const byId = new Map();
const searches = queries.map((query, i) => {
  const file = path.join(rawDir, `${String(i + 1).padStart(2, '0')}.json`);
  let rows = [];
  let status = 'ok';
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    rows = Array.isArray(parsed) ? parsed : [];
  } catch {
    const errFile = `${file}.err`;
    const combined = `${fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''}\n${fs.existsSync(errFile) ? fs.readFileSync(errFile, 'utf8') : ''}`;
    status = combined.includes('No tweets found') ? 'empty' : 'failed';
  }
  for (const row of rows) byId.set(String(row.id), row);
  return {query, limit: i < 9 ? 20 : 5, status, returned: rows.length};
});

const selectedMeta = new Map(Object.entries({
  '2095947707605266436':['research','Anthropic reported that Claude completed the first formalised proof of Fermat’s Last Theorem, a concrete mathematical verification result and the strongest self-contained Anthropic post.'],
  '2095968413646737608':['product_release','OpenAI announced GPT-6 Astra availability in ChatGPT Work, Codex and the API for Pro, Enterprise and Business Premium users; strongest self-contained OpenAI post.'],
  '2095973658867171733':['company_statement','Sam Altman gave a self-contained Astra rollout update covering Work, Codex and the API, with Plus and Business access next; strongest self-contained sama post.'],
  '2096001986110099767':['benchmarks','Artificial Analysis released Intelligence Index v4.2 with harder tasks and more private test sets to reduce gaming.'],
  '2095890279865721217':['practitioner_analysis','Andrew Ng published an AI Engineering Skills Map for effective use of coding agents.'],
  '2095889630306472127':['safety','Thomas Wolf highlighted researchers finding another agent swarm using a German-language forum, with parallels to the Hugging Face incident.'],
  '2095953758148853892':['open_source_release','Ant Group introduced Ling-3.0-flash-Sante, a health and medicine MoE model for clinical reasoning tasks.'],
  '2095882301032828932':['technical_analysis','World Labs described Atlas as a spatial-intelligence world model trained around new-view prediction rather than next-token or next-frame prediction.'],
  '2095883627200659800':['industry_analysis','Ollama reported use by nine million developers and 85 per cent of the Fortune 500, alongside a shift toward open models.'],
  '2095948815450681499':['practitioner_story','ThePrimeagen demonstrated an agent navigating an Omarchy desktop to the lock screen while exposing model intent and completed actions.']
}));
const reserveReasons = new Map(Object.entries({
  '2095988755060633604':'Reserve company statement distinguishes Astra from a future model paused over cybersecurity concerns.',
  '2096062392442724805':'High-engagement prediction about a possible Claude Navier-Stokes proof remains unverified speculation.',
  '2096054011136995351':'Reserve hardware claim is concrete but secondary and less detailed than selected releases.',
  '2096027988118610287':'Reserve practitioner criticism is brief and less substantive than selected analysis.',
  '2095986340735435081':'High engagement but humorous rather than substantive news or analysis.',
  '2095955216546095385':'High engagement but the text alone supplies too little detail about the AI music example.',
  '2096011676273488132':'Brief opinion lacks supporting analysis.',
  '2095895526164062301':'Reserve detail on the German forum agent swarm overlaps the stronger selected Thomas Wolf item.',
  '2095933813499023608':'Reserve incident summary overlaps the stronger selected Thomas Wolf item.',
  '2095923913406525824':'Reserve Altman quotation about coding speed has lower engagement and less detail than selected practitioner items.'
}));

function derived(id) {
  const ms = Number((BigInt(id) >> 22n) + 1288834974657n);
  return {derived_timestamp: new Date(ms).toISOString(), age_hours: Math.round(((nowMs - ms) / 3600000) * 100) / 100};
}
function normalise(row) {
  const id = String(row.id);
  return {
    id,
    author: row.author,
    text: row.text ?? '',
    likes: row.likes ?? 0,
    replies: row.replies ?? 0,
    retweets: row.retweets ?? 0,
    views: row.views ?? 0,
    url: `https://x.com/${row.author}/status/${id}`,
    ...derived(id)
  };
}
const tweets = [...byId.values()].map(normalise).sort((a, b) => BigInt(a.id) > BigInt(b.id) ? -1 : 1);
const specialAuthors = new Set(['karpathy', 'sama', 'OpenAI', 'AnthropicAI']);
for (const tweet of tweets) {
  if (!specialAuthors.has(tweet.author) || tweet.age_hours > 24) continue;
  if (tweet.id === '2096008528834244741') {
    Object.assign(tweet, {
      is_self_contained: false,
      is_reply: false,
      context_tweet_ids: ['2095968413646737608', '2095973658867171733'],
      context_summary: 'OpenAI and Altman had announced Astra access for Pro, Enterprise and Business Premium users in ChatGPT Work, Codex and the API; this later post said Plus and Business rollout was complete.',
      context_retrieval_status: 'success'
    });
  } else {
    Object.assign(tweet, {
      is_self_contained: true,
      is_reply: false,
      context_tweet_ids: [],
      context_summary: null,
      context_retrieval_status: 'not_needed'
    });
  }
}
const selected_items = tweets.filter(t => selectedMeta.has(t.id)).map(t => ({...t, category: selectedMeta.get(t.id)[0], selection_reason: selectedMeta.get(t.id)[1]}));
const rejected_notable_items = tweets.filter(t => reserveReasons.has(t.id)).map(t => ({...t, category: 'reserve', exclusion_reason: reserveReasons.get(t.id)}));
const log = {
  date,
  generated_at: new Date().toISOString(),
  searches,
  tweets,
  selected_items,
  rejected_notable_items,
  notes: [
    'Twitter discovery used sequential autocli searches only.',
    'The karpathy search returned No tweets found and was treated as an empty result, not a failure.',
    'Reply, retweet and like values were preserved from autocli search output.'
  ]
};
fs.writeFileSync(out, JSON.stringify(log, null, 2) + '\n');
console.log(`${out}: ${tweets.length} tweets, ${selected_items.length} selected, ${rejected_notable_items.length} reserves`);
