HELOC CONNECT — Mortgage Payment Check Upgrade

Changes included:
- Stronger, more visible result badges.
- Removed “HELOC CONNECT CALCULATES” from all number cards across the site.
- Simplified labels: Current Payment, Estimated New Payment, Approximate Monthly Savings, Approximate Annual Savings.
- Added property-address autocomplete and current-value pull to Mortgage Payment Check.
- Added original mortgage term selection: 10, 15, 20, 25, 30, or 40 years.
- Added approximate purchase date.
- Added purchase-period value lookup using recorded ATTOM sale data when available.
- Added a clearly labeled historical estimate fallback when recorded sale data is unavailable.
- Added current loan payoff amount.
- Current payment is now estimated automatically from payoff, current rate, and estimated remaining term.
- Honest two-way results: possible savings or current payment appears competitive.
- Beat My Current Rate / Review My Options buttons scroll to client information.
- Existing homepage, mascot, legal pages, form fields, margins, and other calculator flows preserved.

Validation:
- Next.js application compiled successfully.
- TypeScript validation passed.
- The local container hit an EPIPE during Next.js page-data worker collection, which is an environment process-limit issue after successful compilation, not a TypeScript/code compilation error.
