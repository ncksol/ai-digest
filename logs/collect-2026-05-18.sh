#!/usr/bin/env bash
set -u
OUT=/Users/nick/.openclaw/workspace/ai-digest-site/logs/2026-05-18.searches.ndjson
: > "$OUT"
queries=(
"AI since:2026-05-17"
"LLM since:2026-05-17"
"machine learning since:2026-05-17"
"GPT OR Claude OR Gemini since:2026-05-17"
"open source AI model since:2026-05-17"
"AI agent since:2026-05-17"
"Sam Altman since:2026-05-17"
"Dario Amodei since:2026-05-17"
"Demis Hassabis since:2026-05-17"
"from:karpathy since:2026-05-17"
"from:sama since:2026-05-17"
"from:OpenAI since:2026-05-17"
"from:AnthropicAI since:2026-05-17"
)
limits=(20 20 20 20 20 20 20 20 20 5 5 5 5)
for i in "${!queries[@]}"; do
  q=${queries[$i]}; lim=${limits[$i]}; ok=0; err=""
  for attempt in 1 2 3 4; do
    tmp=$(mktemp); er=$(mktemp)
    if autocli twitter search "$q" --limit "$lim" --format json > "$tmp" 2>"$er"; then
      jq -nc --arg q "$q" --argjson limit "$lim" --slurpfile result "$tmp" '{query:$q,limit:$limit,ok:true,result:$result[0]}' >> "$OUT"
      ok=1; rm -f "$tmp" "$er"; break
    else
      err=$(cat "$er")
      if grep -qi "No tweets found" "$er"; then
        jq -nc --arg q "$q" --argjson limit "$lim" '{query:$q,limit:$limit,ok:true,result:[]}' >> "$OUT"
        ok=1; rm -f "$tmp" "$er"; break
      fi
      rm -f "$tmp" "$er"
      case $attempt in 1) sleep 10;; 2) sleep 20;; 3) sleep 30;; esac
    fi
  done
  if [ "$ok" = 0 ]; then
    jq -nc --arg q "$q" --argjson limit "$lim" --arg error "$err" '{query:$q,limit:$limit,ok:false,error:$error}' >> "$OUT"
  fi
  sleep 4
done
