#!/usr/bin/env bash
# Smoke test: verify a published digest is visible on the web.
# Usage: verify-published.sh YYYY-MM-DD
# Exit codes: 0 = OK, 1 = missing in manifest (raw), 2 = digest .md unreachable, 3 = bad arg

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
if echo "$manifest" | grep -q "\"${DATE}\.md\""; then
  echo "✅ manifest.json contains \"${DATE}.md\""
else
  echo "❌ manifest.json missing \"${DATE}.md\" entry (likely missing .md suffix)"
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
