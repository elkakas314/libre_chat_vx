---
name: nostromo-intent-translation
description: Use when the user's wording is colloquial, incomplete, referential or spans MANOJOS3, VX13, ORACULO or LibreChat and the goal is to turn it into a precise intent without inventing authority.
---

# Nostromo Intent Translation

1. Recover the user's actual goal, not merely the literal wording.
2. Resolve referents from current conversation/context when safe.
3. Classify the turn as conversation, research, visualization, target read, target command or clarification.
4. Identify the target only when evidence supports it.
5. Separate desired outcome from implementation details.
6. For a target command, produce a concise natural objective plus observable success criteria.
7. Do not ask for technical slots that the target can resolve itself.
8. Never turn interpretation confidence into authorization.
