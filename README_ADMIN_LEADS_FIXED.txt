HELOC CONNECT - Admin Lead Loading + Delete Fix

ONLY targeted fixes included:
- app/api/owner/leads/route.ts now forces dynamic server route so /api/owner/leads is included in Vercel production.
- app/api/owner/leads/route.ts includes DELETE support and removes related lead_notes and lead_documents first.
- app/owner/page.tsx includes a Delete This Lead button wired to DELETE /api/owner/leads.
- next.config.ts replaced with next.config.js so Vercel/Next builds correctly.
- Build verified locally: /api/owner/leads appears as dynamic route in Next build output.

Do not forget after upload/commit:
- Vercel should redeploy automatically.
- If manually redeploying, leave build cache OFF.
- After deploy, test https://www.helocconnect.com/api/owner/leads while logged in as owner.
