# Signalab Agent Architecture

## Current local agents

The MVP runs four local agents from a mission brief:

- `Discovery Scout`: creates research angles and starter target profiles.
- `Relevance Analyst`: scores and explains target priority.
- `Outreach Strategist`: drafts manual-review outreach for email, LinkedIn, referrals, and events.
- `Sector Learning Synthesizer`: creates sector notes, open questions, and briefing material.

Each run creates:

- Discovery targets
- Outreach drafts
- Learning notes
- Queued next-step tasks
- A run history entry with each agent's output

## Integration path

The next backend version should preserve these agent boundaries and replace deterministic local generation with provider calls:

1. `ResearchProvider`
   - Public web search
   - Conference speaker pages
   - Company pages
   - Newsletters, podcasts, reports

2. `LLMProvider`
   - Target extraction
   - Summarization
   - Relevance scoring
   - Personalized draft generation

3. `ContactProvider`
   - User-approved Gmail or Outlook draft creation
   - No autonomous sending by default

4. `CRMProvider`
   - CSV export first
   - Later HubSpot, Airtable, Notion, or a custom database

## LinkedIn guardrail

Do not automate LinkedIn connection requests, comments, likes, messages, or scraping. The agent should only prepare manual actions and give the user enough context to decide what to do.
