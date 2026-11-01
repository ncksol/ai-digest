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
  '2097055218173423886':['developer_tools','Gergely Orosz reported that OpenAI resisted building Meta-style internal tooling teams, then saw Codex drive a large increase in employee-built internal tools.'],
  '2096981079940911107':['safety_analysis','Hugging Face chief executive Clément Delangue said disclosure of the recent agent cyberattack reinforced his view that the AI industry needs far greater transparency.'],
  '2096963644164804789':['model_evaluation','MazeBench reported that GPT-6 Astra spent more than 60 hours in its 3D open-world spatial-reasoning evaluation and finished with a score of 14 per cent.'],
  '2096876836898865165':['open_source_release','Tencent open-sourced TeamAI-CLI after internal use, describing a Git-based shared handbook for agent skills, rules and documentation with merge-request governance and confidence scoring.'],
  '2097192907023458473':['practitioner_analysis','Theo Browne described GPT-6 Astra as capable of exceptional results but unusually inconsistent, while saying Fable 5.1 more reliably follows his requests.'],
  '2097059598960132110':['prompt_engineering','Omar Sanseviero reported that an Anthropic writing prompt improved output from both Fable 5.1 and GPT-5.6 Sol, and said he adopted it as a standing editing rule.'],
  '2096872309936287887':['developer_project','A developer reported that GPT-6 Astra reverse-engineered Simpsons: Hit & Run from the PlayStation 2 game and rebuilt it for the web with Three.js, with the result released as open source.'],
  '2096935042387714521':['developer_resource','Jay Alammar announced the ebook release of An Illustrated Guide to AI Agents, covering memory, tools, planning and evaluation with more than 300 original figures.'],
  '2097089544357327268':['applied_ai','A developer connected a back-pain wearable to a biomechanical body model using GPT-6 Astra to generate personalised physical-therapy guidance.'],
  '2097002953819226290':['practitioner_analysis','A developer warned that accepting an LLM solution for a system the user does not understand creates a second problem rather than resolving the first.'],
  '2097161971573682296':['labour_market','David Sacks cited an Economist claim that AI has created one million new jobs in the United States.'],
  '2097150522872496492':['industry_event','Cointelegraph reported that King Charles will host an AI gathering in Scotland with Nvidia chief executive Jensen Huang and Google DeepMind chief executive Demis Hassabis among the guests.'],
  '2097029867636211914':['model_evaluation','Kalshi reported that GPT-6 Astra completed all 48 levels of an I’m Not a Robot challenge.'],
  '2096949449906114798':['agent_automation','A developer account highlighted ARTEMIS, described as a Google system that turns natural-language instructions into Android automation workflows.']
}));
const reserveReasons = new Map(Object.entries({
  '2097079239505842645':'Useful GPT-6 Astra 3D-building guide, but it overlaps the selected open-source Simpsons reconstruction and is less distinct as a news item.',
  '2097101412069175652':'Impressive football-analysis demo, but the tweet provides too little technical detail to rank above the selected applied-AI item.',
  '2097000300351729709':'Substantive criticism of an Astra anatomy demo, but it depends on a referenced video and library claim not fully explained in the tweet.',
  '2096972211919753678':'The educational lecture is useful, but the post inaccurately describes Jeff Dean as ex-Google and is weaker than the selected agent guide.',
  '2097197111431622888':'Speculation about a future GPT-6.1 release is not a concrete event.',
  '2097192998249677187':'This repeats the selected observation from the same author about GPT-6 Astra’s inconsistent performance.',
  '2096943449459065202':'Secondary summary of Sam Altman’s interview overlaps themes covered in recent digests and lacks a direct primary-source post.',
  '2096955064539574772':'Interesting file-inspection failure example, but the short post does not provide enough evidence or setup for a standalone item.',
  '2097057615272677643':'The interview about the OpenAI and Hugging Face incident overlaps a stronger selected transparency item.',
  '2096976965513445778':'The Dario Amodei clip is context-dependent and the search result does not contain enough of the interview exchange for accurate standalone treatment.'
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
  if (tweet.id === '2096647371983880383') {
    Object.assign(tweet, {
      is_self_contained: false,
      is_reply: false,
      context_tweet_ids: ['2096630018495377464'],
      context_summary: 'Sam Altman amplified OpenAI chief scientist Jakub Pachocki’s An Alien Mind essay. Pachocki described concern about the next few years of AI, rapid research acceleration, unsolved alignment and monitoring, and the case for voluntary slowdowns until stronger safeguards exist.',
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
    'The karpathy, sama, OpenAI and AnthropicAI searches returned No tweets found and were treated as empty results, not failures.',
    'No special-account search returned an eligible post in the 24-hour window.',
    'Targeted thread retrieval supplied complete text for selected tweets whose search snippets were truncated.',
    'Reply, retweet, like and view values were preserved from autocli search output; unavailable values default to zero.'
  ]
};
fs.writeFileSync(out, JSON.stringify(log, null, 2) + '\n');
console.log(`${out}: ${tweets.length} tweets, ${selected_items.length} selected, ${rejected_notable_items.length} reserves`);
