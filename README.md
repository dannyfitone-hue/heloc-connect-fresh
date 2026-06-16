# HELOC Live MVP System

This is the actual starter system to launch:
- Premium landing page
- Intake form
- Supabase database
- Private client magic-link status portal
- Owner master portal
- Lender portal
- Document request system
- Client document upload
- Status syncing
- Commission calculation

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL editor.
3. Create Supabase Storage bucket: `client-documents`.
4. Copy `.env.example` to `.env.local`.
5. Add Supabase keys.
6. Run:

```bash
npm install
npm run dev
```

## Pages

- `/` Landing page
- `/thank-you/[token]` confirmation page
- `/status/[token]` client dashboard
- `/owner` owner dashboard
- `/lender` lender portal

## Client Statuses

1. Application Received
2. Application Being Processed
3. Matching The Right Lender
4. Lender Matched
5. Lender Will Contact You Shortly
6. Documents Requested
7. Funded
8. Rejected


## SMS Confirmation Setup

Add these environment variables in Vercel:

```text
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
```

After adding them, redeploy the project.

When a client submits the intake form, the system sends this SMS:

"Hi [Name], your HELOC CONNECT funding request has been received. Track your private funding status here: [status link]"


## Smart Funding Calculator Form

The landing page form now includes:
- Separate address fields
- Smart address autocomplete-ready input
- Home value field
- Mortgage balance field
- Loans on property
- Mortgage good-standing question
- Missed payment question
- Possible equity room preview
- Estimated monthly payment preview
- Hidden calculator fields saved into lead notes

Note: Live property valuation/address autocomplete requires connecting a property/address API such as Google Places plus ATTOM/HouseCanary/Estated. The UI is API-ready but does not scrape home values.


## Real Smart Address + Home Value Lookup

The submission form is now ready for real smart address and value lookup.

Add these environment variables in Vercel:

```text
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ATTOM_API_KEY
```

What this does:
- Google Places shows live address suggestions as the client types
- Selecting an address auto-fills street/city/state/ZIP
- The app calls `/api/property-value`
- The API attempts to pull estimated value from ATTOM
- The home value field auto-fills when found
- Equity room and payment preview update automatically

Without the API keys, the form still works, but live autocomplete/value lookup will show an activation message.


## No-Freeze Address Search

The address field no longer uses Google Places directly on the input. It uses a custom server-side address search dropdown to prevent typing freezes.

Required Vercel variable:
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

Optional Vercel variable:
- GOOGLE_MAPS_SERVER_API_KEY

The form searches `/api/address-autocomplete` and shows matching address buttons below the input.
