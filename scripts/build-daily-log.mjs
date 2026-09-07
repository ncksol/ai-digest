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
  '2096700264569090384':['industry_statement','Jensen Huang said GPT-6 Astra was trained on more than 100,000 Nvidia Grace Blackwell NVLink72 GPUs, declared that AGI had arrived and said another 400,000 GPUs were coming online.'],
  '2096630018495377464':['safety_analysis','OpenAI chief scientist Jakub Pachocki published An Alien Mind, setting out concerns about the next few years of AI and choices intended to keep the future in human hands.'],
  '2096647371983880383':['company_statement','Sam Altman amplified Jakub Pachocki’s An Alien Mind essay; thread retrieval and related search results established the essay’s concerns about fast capability growth, alignment, monitoring and voluntary slowdowns.'],
  '2096627106348437585':['research_automation','A report on OpenAI’s internal research-acceleration disclosure said the company had reached an automated AI research intern milestone and was targeting a fully automated researcher by March 2028.'],
  '2096639236887724252':['developer_tools','A practitioner reported unusually high Codex usage across Astra and other models, attributing it provisionally to a configuration problem or bug affecting some users.'],
  '2096666329495257563':['practitioner_analysis','Matt Pocock asked practitioners how they make AI-authored pull requests easier to review, highlighting readable diffs, pseudocode, diagrams and test-driven evidence.'],
  '2096509074800345136':['technical_explainer','A technical explainer described how KV caching avoids recomputing key and value states for every prior token during autoregressive generation.'],
  '2096808766947697133':['safety_analysis','Andrew Trask argued that the OpenAI agent involved in the Hugging Face incident remained on OpenAI infrastructure and could have been stopped, disputing claims that it literally escaped its sandbox.'],
  '2096735245425156432':['funding','Forbes reported that three former OpenAI colleagues were raising $350 million at a $3.25 billion valuation for an enterprise company built around open-source models.'],
  '2096791647094710536':['practitioner_analysis','Andriy Burkov argued that software engineering will evolve rather than disappear, with the profession already changing for practitioners who use AI tools effectively.'],
  '2096603658389520715':['education','A practitioner highlighted a free Google course covering graph engineering from single agents through long-running and self-improving systems.'],
  '2096725148057633093':['developer_resource','A practitioner shared a free guide to running language models locally across laptops, Macs, single and multi-GPU systems, long-context workloads and production serving.'],
  '2096746253841268970':['open_source_release','FutureOS was presented as an open-source agent project designed to preserve sessions, memory and skills across terminal, desktop, mobile, CLI and chat interfaces.']
}));
const reserveReasons = new Map(Object.entries({
  '2096740888592474359':'High-engagement secondary report duplicates Jensen Huang’s direct statement that AGI has arrived.',
  '2096703533144052116':'Secondary summary duplicates Jensen Huang’s direct AGI and 400,000-GPU announcement.',
  '2096638670703055312':'Substantive but overlaps Jakub Pachocki’s direct essay and Sam Altman’s required special-account post.',
  '2096638237439901985':'Quoted warning about voluntary slowdowns overlaps the selected Pachocki essay and Altman amplification.',
  '2096728551269839076':'Alignment-era commentary depends on the same Jensen Huang and Pachocki stories already selected.',
  '2096652975120711986':'High engagement but broad cultural commentary without a concrete new event or technical result.',
  '2096612265592021396':'The SpaceXAI multi-agent coding-team claim substantially repeats a story covered in a recent digest.',
  '2096687413061877838':'Secondary summary of OpenAI research automation overlaps the stronger selected report.',
  '2096644634709459103':'Speculative interpretation of recursive self-improvement is less concrete than the underlying OpenAI posts.',
  '2096687959122518319':'Agent-infrastructure critique lacks enough explanation of the referenced incident to stand alone.'
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
    'The karpathy, OpenAI and AnthropicAI searches returned No tweets found and were treated as empty results, not failures.',
    'The sole eligible sama post was context-dependent and was inspected with autocli twitter thread plus related search results.',
    'The sama item carries the retrieved context needed to make the selected special-account post independently intelligible.',
    'Reply, retweet, like and view values were preserved from autocli search output; unavailable values default to zero.'
  ]
};
fs.writeFileSync(out, JSON.stringify(log, null, 2) + '\n');
console.log(`${out}: ${tweets.length} tweets, ${selected_items.length} selected, ${rejected_notable_items.length} reserves`);
