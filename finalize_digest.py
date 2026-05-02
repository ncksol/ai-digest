#!/usr/bin/env python3
import json, datetime
from pathlib import Path
TODAY='2026-05-02'
proc=json.loads(Path(f'logs/raw/{TODAY}-processed_candidates.json').read_text())
hn=json.loads(Path(f'logs/raw/{TODAY}-hn-searches.json').read_text())
selected_ids={
 '2050250926888468929':('news','OpenAI adoption claim is the main continuation of this week GPT-5.5/Codex story.'),
 '2050290619684393152':('news','OpenAI migration feature supports the Codex adoption story and continues prior Codex coverage.'),
 '2050261221165989969':('analysis','Benchmark analysis tempers the launch narrative and adds technical substance.'),
 '2050251014691840015':('news','Microsoft Agent 365 general availability is a major enterprise-agent announcement.'),
 '2050357097649324517':('news','Google Cloud Gemini Enterprise adds another enterprise-agent product angle.'),
 '2050229058425045178':('analysis','Altman labour-market framing anchors the jobs debate without adding a third sama item.'),
 '2050225746753331562':('analysis','Jensen Huang counterpoint keeps the jobs debate balanced against OpenAI framing.'),
 '2050290896382353432':('news','Google COSMO leak provides a fresh device/Android agent story.'),
 '2050449347137937437':('news','Gemini Flash sighting is a smaller Google model-release signal.'),
 '2050174644280590814':('analysis','Agent coordination research is a useful technical caution.'),
 '2050238223876567129':('analysis','Recursive multi-agent systems adds research variety to the agent discussion.'),
 '2050143942176326105':('analysis','Structural Jevons Paradox broadens coverage to energy/economics.'),
 '2050240810403410211':('analysis','Karpathy provides practitioner caution about slop and incentives.'),
 '2050213732970848664':('news','Meta FAIR pretraining paper gives a research item outside agents and OpenAI.'),
 '2050239816806387774':('personal_story','Production principles provide practitioner lived experience and keep mix from becoming only corporate news.'),
 '2050260964847571161':('analysis','Open-source infiltration wording critique adds governance/technical nuance.'),
 '2050387355551383717':('news','ElevenLabs Agents is a smaller product launch for also notable.'),
}
byid={t['id']:t for t in proc['ranked']}
selected=[]
for tid,(cat,reason) in selected_ids.items():
    t=byid[tid]
    selected.append({k:t[k] for k in ['id','author','derived_timestamp','age_hours']} | {'category':cat,'reason':reason})
rej=proc['rejected'][:]
for t in proc['ranked']:
    if t['id'] not in selected_ids:
        reason='low engagement or low signal relative to selected balanced set'
        if t['author'] in ['@sama','@OpenAI','@demishassabis']:
            reason='watched-account cap' if t['author']=='@sama' else 'balance cap'
        elif t['author'] in ['@MikeBenzCyber','@droidbuilds','@VermaAakash3']:
            reason='unverified or low-quality claim for digest standards'
        rej.append({k:t[k] for k in ['id','author','text','likes','views','derived_timestamp','age_hours']} | {'reason':reason})
log={'date':TODAY,'searches':proc['searches'],'hn_searches':hn,'selected':selected,'rejected_notable':rej}
Path(f'logs/{TODAY}.json').write_text(json.dumps(log,indent=2,ensure_ascii=False),encoding='utf-8')

digest='''# 2 May 2026

OpenAI's GPT-5.5 launch story has turned from capability claims into adoption claims. One week after release, OpenAI said GPT-5.5 was already its strongest model launch, with API revenue growing faster than any previous release and Codex revenue doubling in under seven days as enterprise demand for agentic coding tools increased. (<https://xcancel.com/OpenAI/status/2050250926888468929>) Following yesterday's coverage of OpenAI trying to move Codex beyond programming and into general computer work, the company also pushed migration features for Codex: importing settings, plugins, agents, and project configuration so users can bring their existing workflow across with fewer interruptions. (<https://xcancel.com/OpenAI/status/2050290619684393152>)

The best benchmark note of the morning cut through the victory lap. ARC Prize published its analysis of GPT-5.5 and Opus 4.7 on ARC-AGI-3, saying both systems still failed in ways that look less like missing facts and more like brittle abstraction: false world models, wrong abstraction levels from training data, and cases where the model solved a level but did not reinforce the reward. (<https://xcancel.com/arcprize/status/2050261221165989969>) Hacker News had the same ARC-AGI-3 analysis in circulation under the title “Analyzing GPT-5.5 and Opus 4.7 with ARC-AGI-3”. That matters because the week's GPT-5.5 story has otherwise been told mostly through product rollouts, migration prompts, and developer enthusiasm. ARC's post is a useful reminder that “better at Codex” and “closer to general reasoning” are not the same claim.

Microsoft supplied the enterprise answer. Satya Nadella said Agent 365 is now generally available, extending identity, security, governance, and management systems to AI agents and their interactions across enterprise environments. (<https://xcancel.com/satyanadella/status/2050251014691840015>) Google Cloud made a parallel pitch for Gemini Enterprise, saying users can deploy long-running agents for multi-step autonomous work and manage them through an Inbox command centre. (<https://xcancel.com/googlecloud/status/2050357097649324517>) Hacker News surfaced related discussions around Microsoft's Agent 365 and an open protocol for agent-to-agent commercial negotiation. The through-line is familiar but important: agents are being sold less as chatbots and more as managed enterprise actors.

The labour-market argument took a sharper turn. Sam Altman wrote that OpenAI wants to build tools that “augment and elevate people”, not entities that replace them. (<https://xcancel.com/sama/status/2050229058425045178>) That sat against a blunt counterpoint circulating around Jensen Huang and Dario Amodei: one post quoted Huang dismissing Amodei-style warnings about AI wiping out new-graduate jobs as “ridiculous” and “not helpful”. (<https://xcancel.com/firstadopter/status/2050225746753331562>) Following this week's coverage of cyber automation, coding agents, and AI inside professional workflows, the jobs debate is no longer abstract. It is attached to the products now being shipped.

Google's agent story arrived by leak rather than launch. Min Choi said Google had briefly exposed COSMO, describing local Gemini Nano, screen access, voice match, recall, browser agency, and deep research before it vanished. (<https://xcancel.com/minchoi/status/2050290896382353432>) TestingCatalog also spotted a new Gemini Flash model on LM Arena and an email suggesting Gemini 3.1 Flash Lite availability for Vertex AI customers. (<https://xcancel.com/testingcatalog/status/2050449347137937437>) The implication is that Google's agent push is spreading across Android, Gemini Enterprise, and model infrastructure, even if the public packaging is still uneven.

The safety and systems crowd had the better sceptical material. Rohan Paul pointed to research arguing that current AI-agent groups cannot reliably coordinate or agree on simple decisions, warning that developers often assume adding more agents means better decisions. (<https://xcancel.com/rohanpaul_ai/status/2050174644280590814>) AskAlphaXiv highlighted “Recursive Multi-Agent Systems”, a paper proposing agents that recur together in latent space rather than merely passing text back and forth. (<https://xcancel.com/askalphaxiv/status/2050238223876567129>) Hacker News had adjacent practical threads, including “Show HN: Autoresearch@home”, “Armalo AI - The Infrastructure for Agent Networks”, and an open-sourced YAML-first AI-agent runtime. The market wants agents everywhere; the engineering reality is that coordination, permissions, and adversarial surfaces remain very much unsolved.

The day's broader economics note was energy. Rohan Paul pointed to a paper on “Structural Jevons Paradox”, arguing that falling LLM unit costs can still produce exploding total compute energy demand. (<https://xcancel.com/rohanpaul_ai/status/2050143942176326105>) That is the infrastructure shadow behind the agent boom: cheaper intelligence does not necessarily mean less resource use, especially if cheaper calls make everyone call the models more often. Elegant, in the way a bonfire is elegant.

Practitioner material gave the morning some useful texture. Vasuman laid out five production AI principles: audit the actual workflow first, keep deterministic code where possible, and use LLMs only where judgement is needed. (<https://xcancel.com/vasuman/status/2050239816806387774>) Karpathy, in a small but pointed note, warned that even useful AI-generated concept material can leak slop that becomes harder to identify, especially when teams are tempted to say “eh just ship it”. (<https://xcancel.com/karpathy/status/2050240810403410211>) Those two posts belong together: the frontier labs are selling autonomy, while the practitioners are still trying to keep the machinery inspectable.

Research outside the agent lane was not absent. Omar Khattab highlighted a Meta FAIR paper on self-improving LLMs that moves safety, factuality, and reasoning behaviours into pretraining rather than bolting them on afterwards. (<https://xcancel.com/omarsar0/status/2050213732970848664>) Lukasz Olejnik pushed back on Pentagon language about Chinese open-source models “infiltrating” companies, arguing that a raw model is not an agent and does not sneak into networks or install itself. (<https://xcancel.com/lukOlejnik/status/2050260964847571161>) It was a useful reminder that AI discourse still has a vocabulary problem: model, agent, system, product, and threat keep getting blurred together, sometimes by people who should know better.

Finally, the governance thread continued from earlier in the week. Reuters summarised the first week of Elon Musk's lawsuit testimony against OpenAI and Sam Altman. (<https://xcancel.com/Reuters/status/2050387295161737296>) Following the previous digests on OpenAI's nonprofit origins, Microsoft cloud renegotiation, and courtroom testimony, this remains the background legal noise behind the GPT-5.5 and Codex push: OpenAI is scaling the products at the same time as its founding structure is being litigated in public.

Also notable:

- OpenAI Devs announced “Pets. Now in Codex”, with a `/pet` command to wake one. Not frontier AI in the grand civilisational sense, but a revealing attempt to make long-running agent work feel more companionable. (<https://xcancel.com/OpenAIDevs/status/2050275713824211041>)
- ElevenLabs Agents was described as a voice-agent product for support workflows, plugging into GPT, Claude, and Gemini. (<https://xcancel.com/alvinfoo/status/2050387355551383717>)
- Eric Topol pointed readers to an explainer thread on a new LLM paper in Science. (<https://xcancel.com/EricTopol/status/2050232575088898304>)
'''
Path(f'digests/{TODAY}.md').write_text(digest,encoding='utf-8')
print('wrote logs and digest')
