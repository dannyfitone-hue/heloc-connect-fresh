HELOC CONNECT VALUE LOOKUP FIX

This version updates:
app/api/property-value/route.ts

The route now tries multiple ATTOM endpoints:
- AVM Detail
- AVM Snapshot
- Basic Profile
- Assessment Snapshot
- Assessment Detail
- Sale Snapshot

This gives the calculator a much better chance to auto-fill estimated property value.

After uploading:
1. Commit to GitHub.
2. Redeploy on Vercel.
3. Make sure ATTOM_API_KEY exists in Vercel Environment Variables.
4. Test an address.

If ATTOM still returns no value, the ATTOM plan may not include AVM value for that address, or the specific address may not have returned valuation data.
