# Signalab Relationship Agent

Local MVP for a Signalab customer discovery and partnership agent.

## What it does

- Tracks discovery targets across sectors, organizations, and channels.
- Scores targets using fit, access, urgency, and available context.
- Runs a four-agent local workflow: Discovery Scout, Relevance Analyst, Outreach Strategist, and Sector Learning Synthesizer.
- Converts a mission brief into starter targets, queued tasks, outreach drafts, and learning notes.
- Drafts manual-send email and LinkedIn outreach.
- Captures learning notes and groups them into sector briefs.
- Keeps data in browser local storage for the first prototype.

## Run

```bash
npm run dev
```

Then open:

```text
http://localhost:5174
```

## Product guardrail

This prototype does not automate LinkedIn actions. It drafts copy and suggests manual next steps so Signalab can avoid account and reputation risk.

## Next build steps

- Add OpenAI-powered research and summarization behind the same agent roles.
- Add web search/source ingestion for public, permitted sources.
- Add source citation storage for people, companies, and insights.
- Add Gmail or Outlook draft creation with explicit human approval.
- Add export to CSV or CRM.
- Add a scheduled weekly sector brief.
