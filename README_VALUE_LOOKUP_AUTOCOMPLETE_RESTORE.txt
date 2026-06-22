HELOC CONNECT — VALUE LOOKUP / ADDRESS AUTOCOMPLETE RESTORE

This version keeps all portals and existing lead/status routes untouched.

Changed files:
- app/api/address-autocomplete/route.ts
- app/api/property-value/route.ts

Fix included:
1. Address autocomplete now pulls Google Place Details after suggestions, so selected addresses include street, city, state, and ZIP instead of only the short prediction label.
2. Property value lookup now retries ATTOM using multiple complete address formats.
3. Street suffix variants are tried, e.g. Drive/Dr, Street/St, Avenue/Ave, Road/Rd.
4. If Google prediction is missing ZIP, the property-value route geocodes the selected address before calling ATTOM.
5. Client-facing error no longer mentions ATTOM.

Required Vercel env variables:
- GOOGLE_MAPS_SERVER_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- ATTOM_API_KEY

Portals untouched:
- owner portal
- lender portal
- client status pages
- lead submit route
