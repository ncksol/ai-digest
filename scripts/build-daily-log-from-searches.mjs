#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [date, rawDirArg, configArg, outputArg] = process.argv.slice(2);
if (!date || !rawDirArg || !configArg || !outputArg) {
  throw new Error('usage: build-daily-log-from-searches.mjs YYYY-MM-DD RAW_DIR CONFIG_JSON OUTPUT_JSON');
}

const rawDir = path.resolve(rawDirArg);
const config = JSON.parse(fs.readFileSync(path.resolve(configArg), 'utf8'));
const output = path.resolve(outputArg);
const nowMs = Date.parse(`${date}T07:00:00Z`);
const since = new Date(nowMs - 86400000).toISOString().slice(0, 10);
const queries = [
  `AI since:${since}`,
  `LLM since:${since}`,
  `machine learning since:${since}`,
  `GPT OR Claude OR Gemini since:${since}`,
  `open source AI model since:${since}`,
  `AI agent since:${since}`,
  `Sam Altman since:${since}`,
  `Dario Amodei since:${since}`,
  `Demis Hassabis since:${since}`,
  `from:karpathy since:${since}`,
  `from:sama since:${since}`,
  `from:OpenAI since:${since}`,
  `from:AnthropicAI since:${since}`
];
const limits = [20, 20, 20, 20, 20, 20, 20, 20, 20, 5, 5, 5, 5];
const byId = new Map();

function locate(index) {
  const plain = path.join(rawDir, `${index}.json`);
  const padded = path.join(rawDir, `${String(index).padStart(2, '0')}.json`);
  return fs.existsSync(plain) ? plain : padded;
}

const searches = queries.map((query, index) => {
  const file = locate(index + 1);
  const errFile = path.join(rawDir, `${index + 1}.err`);
  let rows = [];
  let status = 'ok';
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    rows = Array.isArray(parsed) ? parsed : [];
    const errorText = fs.existsSync(errFile) ? fs.readFileSync(errFile, 'utf8').trim() : '';
    if (rows.length === 0 && errorText) status = errorText.includes('No tweets found') ? 'empty' : 'failed';
    else if (rows.length === 0) status = 'empty';
  } catch {
    status = 'failed';
  }
  for (const row of rows) byId.set(String(row.id), row);
  return { query, limit: limits[index], status, returned: rows.length };
});

function derived(id) {
  const ms = Number((BigInt(id) >> 22n) + 1288834974657n);
  return {
    derived_timestamp: new Date(ms).toISOString(),
    age_hours: Math.round(((nowMs - ms) / 3600000) * 100) / 100
  };
}

function normalise(row) {
  const id = String(row.id);
  const base = {
    id,
    author: row.author,
    text: row.text ?? '',
    likes: row.likes ?? 0,
    replies: row.replies ?? 0,
    retweets: row.retweets ?? 0,
    views: row.views ?? 0,
    url: `https://xcancel.com/${row.author}/status/${id}`,
    ...derived(id)
  };
  if (config.contexts?.[id]) Object.assign(base, config.contexts[id]);
  else if (['karpathy', 'sama', 'OpenAI', 'AnthropicAI'].includes(row.author)) {
    Object.assign(base, {
      is_self_contained: true,
      is_reply: false,
      context_tweet_ids: [],
      context_summary: null,
      context_retrieval_status: 'not_needed'
    });
  }
  return base;
}

const tweets = [...byId.values()]
  .map(normalise)
  .sort((a, b) => BigInt(a.id) > BigInt(b.id) ? -1 : 1);
const eligible = new Map(tweets.filter(tweet => tweet.age_hours >= 0 && tweet.age_hours <= 24).map(tweet => [tweet.id, tweet]));
const selected_items = Object.entries(config.selected ?? {}).map(([id, meta]) => {
  const tweet = eligible.get(id);
  if (!tweet) throw new Error(`selected tweet ${id} is missing or outside the 24-hour window`);
  return { ...tweet, category: meta.category, selection_reason: meta.selection_reason };
});
const rejected_notable_items = Object.entries(config.reserves ?? {}).flatMap(([id, exclusion_reason]) => {
  const tweet = eligible.get(id);
  return tweet ? [{ ...tweet, category: 'reserve', exclusion_reason }] : [];
});

const log = {
  date,
  generated_at: new Date().toISOString(),
  searches,
  tweets,
  selected_items,
  rejected_notable_items,
  notes: config.notes ?? []
};
fs.writeFileSync(output, `${JSON.stringify(log, null, 2)}\n`);
console.log(`${output}: ${tweets.length} tweets, ${selected_items.length} selected, ${rejected_notable_items.length} reserves`);
