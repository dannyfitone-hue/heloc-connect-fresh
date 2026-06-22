HELOC CONNECT - RentCast Property Value Lookup Fix

What changed:
- Replaced ATTOM property value lookup in app/api/property-value/route.ts
- New route uses RENTCAST_API_KEY
- New provider endpoint: https://api.rentcast.io/v1/avm/value
- Header used: X-Api-Key
- Keeps Google Maps address cleanup/geocode support
- Keeps manual value fallback if RentCast cannot return a value

Required Vercel variable:
RENTCAST_API_KEY=your_new_rentcast_key

Important:
- Do not delete Google Maps key; autocomplete still uses it.
- ATTOM_API_KEY is no longer required for property value lookup after this version deploys.
- Since the RentCast key was exposed in a screenshot, create a fresh RentCast API key after confirming everything works, then replace RENTCAST_API_KEY in Vercel and delete the exposed old key.
