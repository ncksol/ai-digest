#!/usr/bin/env bash
# Smoke test: verify a published digest is visible on the web.
# Usage: verify-published.sh YYYY-MM-DD
# Exit codes: 0 = OK, 1 = manifest problem (missing/shape/count), 2 = digest .md unreachable, 3 = bad arg

set -u

DATE="${1:-}"
if [[ ! "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "❌ verify-published: bad date arg: '$DATE'"
  exit 3
fi

BUST=$(date +%s)
RAW_MANIFEST="https://raw.githubusercontent.com/ncksol/ai-digest/main/manifest.json?bust=${BUST}"
RAW_DIGEST="https://raw.githubusercontent.com/ncksol/ai-digest/main/digests/${DATE}.md?bust=${BUST}"
LIVE_DIGEST="http://ncksol.dev/ai-digest/digests/${DATE}.md?bust=${BUST}"

echo "🔍 Smoke test for ${DATE}"

# 1) Manifest entry must be exactly "<DATE>.md"
manifest=$(curl -fsSL --max-time 15 "$RAW_MANIFEST" || true)
if [[ -z "$manifest" ]]; then
  echo "❌ Could not fetch raw manifest: $RAW_MANIFEST"
  exit 1
fi
# Validate SHAPE, the date entry, and archive count via node (the site reads
# manifest.digests - a bare array or dropped .md suffix silently kills render).
manifest_check=$(MANIFEST_JSON="$manifest" CHECK_DATE="$DATE" node -e '
  const raw = process.env.MANIFEST_JSON || "";
  const date = process.env.CHECK_DATE;
  let m;
  try { m = JSON.parse(raw); } catch { console.log("FAIL not-json"); process.exit(0); }
  if (!m || !Array.isArray(m.digests)) { console.log("FAIL wrong-shape:" + (Array.isArray(m) ? "bare-array" : typeof m)); process.exit(0); }
  const re = /^\d{4}-\d{2}-\d{2}\.md$/;
  const bad = m.digests.filter(f => !re.test(f));
  if (bad.length) { console.log("FAIL bad-entries:" + bad.slice(0,3).join(",")); process.exit(0); }
  if (!m.digests.includes(date + ".md")) { console.log("FAIL missing-date"); process.exit(0); }
  if (m.digests.length < 2) { console.log("FAIL too-few:" + m.digests.length); process.exit(0); }
  console.log("OK count=" + m.digests.length);
' 2>&1)
if [[ "$manifest_check" == OK* ]]; then
  echo "✅ manifest.json valid: object shape, contains ${DATE}.md (${manifest_check#OK })"
else
  echo "❌ manifest.json check failed: ${manifest_check}"
  echo "--- manifest head ---"
  echo "$manifest" | head -5
  exit 1
fi

# 2) Raw .md must be reachable
if curl -fsSL --max-time 15 -o /dev/null "$RAW_DIGEST"; then
  echo "✅ raw digest reachable: ${DATE}.md"
else
  echo "❌ raw digest not reachable: $RAW_DIGEST"
  exit 2
fi

# 3) Live (CDN) URL: best-effort. CDN cache may lag; warn but don't fail.
if curl -fsSL --max-time 15 -o /dev/null "$LIVE_DIGEST"; then
  echo "✅ live digest reachable: ${LIVE_DIGEST}"
else
  echo "⚠️  live digest not yet visible (CDN cache may be stale): ${LIVE_DIGEST}"
fi

echo "✅ Smoke test passed"
exit 0
