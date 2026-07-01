V39 strict neutral SMS update

Changes made only to SMS wording/sanitization:
- Outgoing SMS templates use "HC" only.
- SMS bodies are stripped of restricted terms before sending.
- URLs are removed from SMS carrier test messages to avoid domain/content filtering.
- Even if Owner Dashboard SMS templates contain restricted words, outgoing SMS is sanitized before Telnyx receives it.
- Telnyx send mode remains from_only unless TELNYX_SEND_MODE is changed in Vercel.

Purpose:
Carrier delivery test with no HELOC, mortgage, finance, credit, loan, refinance, equity, cash, or branded URL wording in SMS body.
