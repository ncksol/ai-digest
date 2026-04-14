#!/usr/bin/env node
/**
 * generate-stubs.js - Generate OG meta tag stubs for AI Digest dates.
 * 
 * Usage:
 *   node generate-stubs.js                    # Generate stubs for ALL dates in manifest
 *   node generate-stubs.js 2026-04-14         # Generate stub for a specific date
 *   node generate-stubs.js --from-manifest    # Same as no args
 * 
 * Each stub is a minimal HTML file at /<date>/index.html with:
 *   - OG meta tags (title, description, image)
 *   - twitter:card meta tags
 *   - Meta refresh + JS redirect to the main page
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname);
const DIGESTS_DIR = path.join(SITE_DIR, 'digests');
const MANIFEST_PATH = path.join(SITE_DIR, 'manifest.json');
const BASE_URL = 'https://ncksol.github.io/ai-digest';
const OG_IMAGE = `${BASE_URL}/og-image.png`;

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function extractHeadlines(markdown, max = 3) {
  const lines = markdown.split('\n');
  const headlines = [];
  for (const line of lines) {
    // Bold-only paragraphs are story headings in the digest format
    const match = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (match && !match[1].toLowerCase().startsWith('also notable')) {
      headlines.push(match[1].replace(/\*\*/g, ''));
      if (headlines.length >= max) break;
    }
  }
  // Fallback for prose-format digests: extract key topic sentences
  if (headlines.length === 0) {
    // Join into paragraphs, split on double newline
    const paragraphs = markdown.split(/\n\n+/)
      .map(p => p.replace(/^#+\s+.*/, '').trim())
      .filter(p => p.length > 30 && !p.startsWith('**Also'));
    for (const para of paragraphs.slice(0, 3)) {
      // Take first sentence
      const sentence = para.split(/\.\s/)[0];
      const clean = sentence.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').trim();
      if (clean.length > 20) {
        headlines.push(clean.length > 70 ? clean.slice(0, 67) + '...' : clean);
      }
      if (headlines.length >= max) break;
    }
  }
  return headlines;
}

function buildDescription(headlines) {
  if (headlines.length === 0) return 'Daily briefings in artificial intelligence';
  const joined = headlines.join(' | ');
  return joined.length <= 155 ? joined : joined.slice(0, 152) + '...';
}

function generateStub(dateStr, description) {
  const title = `The AI Digest - ${formatDate(dateStr)}`;
  const url = `${BASE_URL}/${dateStr}/`;
  const mainPageUrl = `${BASE_URL}/?date=${dateStr}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="The AI Digest">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
<meta name="twitter:image" content="${OG_IMAGE}">
<meta http-equiv="refresh" content="0;url=${mainPageUrl}">
</head>
<body>
<p>Redirecting to <a href="${mainPageUrl}">The AI Digest - ${formatDate(dateStr)}</a>...</p>
<script>window.location.replace("${mainPageUrl}");</script>
</body>
</html>
`;
}

function processDate(dateStr) {
  const digestPath = path.join(DIGESTS_DIR, `${dateStr}.md`);
  let description = 'Daily briefings in artificial intelligence';

  if (fs.existsSync(digestPath)) {
    const md = fs.readFileSync(digestPath, 'utf8');
    const headlines = extractHeadlines(md);
    description = buildDescription(headlines);
  }

  const stubDir = path.join(SITE_DIR, dateStr);
  fs.mkdirSync(stubDir, { recursive: true });

  const stubPath = path.join(stubDir, 'index.html');
  fs.writeFileSync(stubPath, generateStub(dateStr, description));
  console.log(`  ✓ ${dateStr}/index.html (${description.slice(0, 60)}...)`);
}

// Main
const args = process.argv.slice(2);
const dateArg = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));

if (dateArg) {
  console.log('Generating stub for single date:');
  processDate(dateArg);
} else {
  // Process all dates from manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('manifest.json not found');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const dates = (manifest.digests || [])
    .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .map(f => f.replace(/\.md$/, ''));

  console.log(`Generating stubs for ${dates.length} dates:`);
  for (const d of dates) {
    processDate(d);
  }
}

console.log('Done.');
