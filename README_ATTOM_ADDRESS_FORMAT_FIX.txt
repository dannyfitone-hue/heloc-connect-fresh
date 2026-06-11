HELOC CONNECT — ATTOM ADDRESS FORMAT FIX

This version fixes the ATTOM home value lookup by sending:
address1 = street address
address2 = city, state zip

Before this fix, the route sent the full address into address1 and left address2 blank.
ATTOM often returns no valuation data when the address is formatted that way.

Files changed:
- app/api/property-value/route.ts
- app/page.tsx

Deploy steps:
1. Upload/replace files in GitHub with this ZIP contents.
2. Commit.
3. Vercel auto-deploys.
4. Make sure ATTOM_API_KEY is still in Vercel Environment Variables.
5. Test the same address again.
