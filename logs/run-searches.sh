#!/bin/bash
# Sequential autocli twitter searches for the daily digest. One at a time, 4s apart.
D=2026-08-09
OUT=/Users/nick/.openclaw/workspace/ai-digest-site/logs/raw-2026-08-10
mkdir -p "$OUT"

run() {
  local name="$1"; shift
  local query="$1"; shift
  local limit="$1"; shift
  local n=0
  while [ $n -lt 3 ]; do
    autocli twitter search "$query" --limit "$limit" --format json > "$OUT/$name.json" 2> "$OUT/$name.err"
    if [ $? -eq 0 ]; then break; fi
    if grep -qi "no tweets found" "$OUT/$name.err" "$OUT/$name.json" 2>/dev/null; then echo "[]" > "$OUT/$name.json"; break; fi
    n=$((n+1))
    sleep $((n*10))
  done
  echo "== $name done ($(wc -c < "$OUT/$name.json") bytes)"
  sleep 4
}

run s01 "AI since:$D" 20
run s02 "LLM since:$D" 20
run s03 "machine learning since:$D" 20
run s04 "GPT OR Claude OR Gemini since:$D" 20
run s05 "open source AI model since:$D" 20
run s06 "AI agent since:$D" 20
run s07 "Sam Altman since:$D" 20
run s08 "Dario Amodei since:$D" 20
run s09 "Demis Hassabis since:$D" 20
run s10 "from:karpathy since:$D" 5
run s11 "from:sama since:$D" 5
run s12 "from:OpenAI since:$D" 5
run s13 "from:AnthropicAI since:$D" 5
echo "ALL SEARCHES COMPLETE"
