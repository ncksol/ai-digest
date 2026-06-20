import json

inp = json.load(open("/Users/nick/.openclaw/workspace/ai-digest-site/logs/2026-06-20.editor-cycle-1.input.json"))
pool = inp["tweet_pool"]

# All returned tweets we tracked (selected + reserve), with full metrics.
returned = []
for t in pool:
    returned.append({
        "id": t["tweet_id"],
        "author": t["author"],
        "text": t["text"],
        "likes": t["likes"],
        "replies": t["replies"],
        "retweets": t["retweets"],
        "views": t["views"],
        "derived_timestamp": t["derived_timestamp"],
        "age_hours": t["age_hours"],
    })

selected = []
for t in pool:
    if t["pool_role"] == "selected":
        selected.append({
            "id": t["tweet_id"],
            "author": t["author"],
            "category": t["category"],
            "reason": t["selection_reason"],
        })

rejected = [
    {"id": "2067979369339875619", "author": "carolecadwalla", "reason": "Same Altman-biopic story as the selected Variety item; held as same-story reserve to respect the single-item story cap."},
    {"id": "2068062908018253936", "author": "DiscussingFish", "reason": "Same Altman-biopic story; extra detail on the reported ending, held as reserve."},
    {"id": "2067962147632451826", "author": "0xwhrrari", "reason": "Relayed Hassabis 'small teams' quote; weaker attribution and lower priority than primary items."},
    {"id": "2067544000000000000", "author": "twetsfyp", "reason": "Opus 3D websites demo derived to ~46.8h old; outside 24h window and promotional."},
    {"id": "2067795772439982591", "author": "Michaelzsguo", "reason": "Rent-out-MacBook inference; derived to ~25.8h, outside 24h window."},
    {"id": "2067837249912528995", "author": "vicky_grok", "reason": "Stanford LLM lecture clip; derived to ~25.8h, outside 24h window."},
    {"id": "2068017741458755722", "author": "AnatoliKopadze", "reason": "Karpathy 'people who don't use LLMs are losing' relay; engagement-bait article promo with no concrete event."},
    {"id": "2068022058735558849", "author": "shiri_shh", "reason": "One-person billion-dollar company quote; weak attribution, no concrete event."},
]

log = {
    "date": "2026-06-20",
    "reference_utc": "2026-06-20T07:00:00Z",
    "since_date": "2026-06-19",
    "searches": inp["searches"],
    "editor": {
        "verdict": "pass",
        "cycle": 1,
        "removed_items": [],
        "promoted_reserve_items": [],
        "needs_additional_search": False,
        "notes": "Editor returned pass on first content attempt (verdict valid); first reply was rejected by strict extractor for code-fence/prose wrapping, retried once and got pure JSON which validated ok. Side-effects checker flagged 3 retry workflow artifacts (extract.stderr, openclaw.retry.json, raw.retry.stderr) as unexpected_paths; these are workflow files created by the main job during the editor retry, not editor-agent side effects. No digest or manifest files were modified by the editor.",
    },
    "returned_tweets": returned,
    "selected_items": selected,
    "rejected_notable_items": rejected,
}

out = "/Users/nick/.openclaw/workspace/ai-digest-site/logs/2026-06-20.json"
with open(out, "w") as f:
    json.dump(log, f, indent=2, ensure_ascii=False)
print("wrote", out, "selected", len(selected), "returned", len(returned))
