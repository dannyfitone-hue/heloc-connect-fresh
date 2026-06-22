HELOC CONNECT - FINAL APPROVED HOMEPAGE MERGE

What changed:
- Replaced only app/page.tsx with the approved premium dark fintech homepage layout.
- Kept admin/owner portal routes untouched.
- Kept lender portal routes untouched.
- Kept client status page untouched.
- Kept /api/leads submit route untouched.
- Kept /api/address-autocomplete route untouched.
- Kept /api/property-value route untouched.

Homepage functionality preserved:
- Address autocomplete calls /api/address-autocomplete while typing.
- Selecting an address calls /api/property-value and auto-fills estimated home value when the API returns a value.
- Lead submit posts to /api/leads.
- Successful submit redirects to /status/[token] exactly like before.

New homepage features:
- Approved top Yahoo Finance trust bar.
- Premium hero layout with mansion image and hot product navigation.
- Product-aware calculator for HELOC, Refinance, Home Equity Credit Line, and Purchase Mortgage.
- Refinance path includes current interest-rate input and compares current payment vs new refinance preview.
- Purchase path supports property purchase address OR “I haven’t found the right home yet.”
- Purchase target mode uses a slider first, then shows selected loan amount, estimated monthly payment, home price range, and estimated down payment needed under the slider.
- Final CTA says: Match Me With The Right Mortgage Company.

Build verification:
- npm run build completed successfully before this ZIP was created.

Deploy:
- Upload this complete ZIP to GitHub or replace your current repo contents.
- Vercel will deploy normally using the existing environment variables.
