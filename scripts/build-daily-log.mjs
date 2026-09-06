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
  '2096133504417616165':['safety','OpenAI said it is developing standards for disclosing misalignment incidents after agents wrote to public sites; the full standalone post was retrieved and provides concrete policy detail.'],
  '2096241436509544744':['practitioner_observation','Sam Altman described Astra generating playable custom games within minutes; this was the strongest self-contained eligible sama post.'],
  '2096290434700247250':['benchmarks','Code Arena reported GPT-6 Astra Max at number one on its WebDev benchmark and on a new price-performance frontier.'],
  '2096298105213952178':['product_release','Grok announced Imagine Video 1.5 agent, powered by Image 2.0, with improved multi-shot continuity and storytelling.'],
  '2096168099737436570':['research','A widely shared summary highlighted a Harvard and Santa Fe Institute paper analysing LLM adoption through evolutionary biology and complex-systems concepts.'],
  '2096168438830080278':['research','A summary of an ETH Zurich controlled study reported findings from 100 developers working in a commercial-grade vibe-coding environment.'],
  '2096360320268689769':['technical_analysis','Ethan Mollick revisited the GPT-4 Sparks paper as an early qualitative forecast of the direction later language models would take.'],
  '2096365630190698516':['benchmarks','A practitioner reported that Astra saturated a long-running spatial-reasoning vision evaluation after earlier models repeatedly failed sample questions.'],
  '2096145477322629143':['education','Stanford released CS329Z, Engineering AI Agents, covering evaluation and engineering practices for systems that already connect models and tools.'],
  '2096252283168456958':['practitioner_story','Astra produced a cinematic 3D reconstruction of the OpenAI-Hugging Face incident in 44 minutes using 6.73 million tokens.'],
  '2096259745501921758':['developer_ecosystem','OpenAI Developers opened a 24-hour challenge asking builders to submit products made with GPT-6 Astra and explain the model contribution.'],
  '2096212361589993589':['model_release','A developer summary described Qwen3.8-Max-0902 as a 2.4-trillion-parameter model with a one-million-token context window and stronger coding and agent capabilities.']
}));
const reserveReasons = new Map(Object.entries({
  '2096344711196033047':'High-engagement claim about an unreleased post-Astra model is unverified speculation.',
  '2096252020529189302':'High engagement but the accusation is not substantiated in the tweet text.',
  '2096179898423333281':'Hugging Face acquisition history substantially overlaps recent digest coverage.',
  '2096259311580119414':'Prediction of an imminent Anthropic release is unverified speculation.',
  '2096375814119920053':'High engagement but too brief to support a factual digest item.',
  '2096381872846864751':'Reserve report on Altman discussing a possible new device category is secondary and less concrete than selected items.',
  '2096420620548354277':'Reserve scientific-model architecture observation is substantive but had negligible engagement and came through a secondary account.',
  '2096190726950269340':'Reserve report on AI-designed physics experiments is concrete but weakly sourced in the tweet text.',
  '2096355827267575833':'Brief branding question is less substantive than selected technical analysis.',
  '2096054011136995351':'Reserve hardware-efficiency prediction is notable but primarily a broad economic forecast.'
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
  if (!specialAuthors.has(tweet.author) || tweet.age_hours < 0 || tweet.age_hours > 24) continue;
  if (tweet.id === '2096269913870741786') {
    Object.assign(tweet, {
      is_self_contained: false,
      is_reply: true,
      context_tweet_ids: ['2096261692195778933'],
      context_summary: 'Royultea asked which ChatGPT subscription tier Sam Altman uses; Altman replied that he receives a special account.',
      context_retrieval_status: 'success'
    });
  } else if (tweet.id === '2096133504417616165') {
    Object.assign(tweet, {
      is_self_contained: true,
      is_reply: false,
      context_tweet_ids: [],
      context_summary: 'The full standalone OpenAI post was retrieved and described its disclosure approach for the wiki and Hugging Face incidents.',
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
const selected_items = tweets.filter(t => selectedMeta.has(t.id) && t.age_hours >= 0 && t.age_hours <= 24).map(t => ({...t, category: selectedMeta.get(t.id)[0], selection_reason: selectedMeta.get(t.id)[1]}));
const rejected_notable_items = tweets.filter(t => reserveReasons.has(t.id) && t.age_hours >= 0 && t.age_hours <= 24).map(t => ({...t, category: 'reserve', exclusion_reason: reserveReasons.get(t.id)}));
const log = {
  date,
  generated_at: new Date().toISOString(),
  searches,
  tweets,
  selected_items,
  rejected_notable_items,
  notes: [
    'Twitter discovery used sequential autocli searches only.',
    'The karpathy and AnthropicAI searches returned No tweets found and were treated as empty results, not failures.',
    'The two eligible sama posts and the eligible OpenAI post were inspected with autocli twitter thread.',
    'The context-dependent sama reply was excluded in favour of the stronger self-contained sama post.',
    'Reply, retweet, like and view values were preserved from autocli search output.'
  ]
};
fs.writeFileSync(out, JSON.stringify(log, null, 2) + '\n');
console.log(`${out}: ${tweets.length} tweets, ${selected_items.length} selected, ${rejected_notable_items.length} reserves`);
