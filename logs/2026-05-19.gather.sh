#!/usr/bin/env bash
set -u
cd /Users/nick/.openclaw/workspace/ai-digest-site
mkdir -p logs
DATE=2026-05-19
SINCE=2026-05-18
queries=(
"AI since:$SINCE"
"LLM since:$SINCE"
"machine learning since:$SINCE"
"GPT OR Claude OR Gemini since:$SINCE"
"open source AI model since:$SINCE"
"AI agent since:$SINCE"
"Sam Altman since:$SINCE"
"Dario Amodei since:$SINCE"
"Demis Hassabis since:$SINCE"
"from:karpathy since:$SINCE"
"from:sama since:$SINCE"
"from:OpenAI since:$SINCE"
"from:AnthropicAI since:$SINCE"
)
: > logs/$DATE.searches.jsonl
fail=0
i=0
for q in "${queries[@]}"; do
  i=$((i+1))
  out="logs/$DATE.search-$i.json"
  err="logs/$DATE.search-$i.err"
  ok=0
  for attempt in 1 2 3; do
    if autocli twitter search "$q" --limit 20 --format json > "$out" 2>"$err"; then ok=1; break; fi
    if grep -qi "No tweets found" "$err"; then echo '[]' > "$out"; ok=1; break; fi
    sleep $((attempt*10))
  done
  if [ "$ok" -ne 1 ]; then fail=$((fail+1)); fi
  jq -n --arg q "$q" --argjson idx "$i" --arg out "$out" --arg err "$(cat "$err" 2>/dev/null | head -c 1000)" --argjson ok "$ok" '{idx:$idx,query:$q,ok:($ok==1),out:$out,err:$err}' >> logs/$DATE.searches.jsonl
  sleep 4
done
if [ "$fail" -gt 6 ]; then exit 42; fi
