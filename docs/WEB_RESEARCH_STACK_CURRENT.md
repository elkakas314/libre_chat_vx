# LibreChat VX — Web Research Stack CURRENT

Date: 2026-10-07
Status: SOURCE_DECISION / LIVE_NOT_VERIFIED

## Baseline

Use LibreChat native Web Search with:
- searchProvider: keenable
- scraperProvider: keenable
- rerankerType: none

Reason: it provides public search + page fetch without an API key and requires no local daemon.

## Optional self-hosted tier

SearXNG:
- use when search privacy, engine control or independence justifies operating another service;
- LibreChat supports private SearXNG endpoints through explicit allowedAddresses.

Firecrawl:
- use when page extraction quality requires it;
- can be external or custom/self-hosted;
- adds another dependency and should not be mandatory for ordinary browsing.

## Routing policy

Operational truth -> target readback.
User files -> File Search/Context.
Public web read -> Web Search.
Interactive website -> Browser/Playwright only when interaction is required.

No public research path grants material target authority.
