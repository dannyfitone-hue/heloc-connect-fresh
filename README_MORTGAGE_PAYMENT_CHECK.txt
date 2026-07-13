HELOC CONNECT - Mortgage Payment Check Update

Added a fourth service option: AM I PAYING TOO MUCH?

This dedicated calculator asks for:
- Current mortgage balance
- Current monthly mortgage payment
- Current interest rate
- Current credit score range

Behavior:
- If the estimated comparable payment is meaningfully lower, it shows possible monthly and annual savings and a Beat My Current Rate button.
- If no meaningful improvement is estimated, it states that the current mortgage payment appears competitive and offers a Review My Options button.
- Both buttons scroll directly to the existing client-information section.
- Payment-check inputs and results are saved in the lead notes.

Existing HELOC, Refinance, Purchase, homepage, mascot, client form, legal pages, portal, email, SMS, and dashboard functionality were left in place.

Deployment:
- Deploy to the same Vercel project.
- Existing environment variables continue to apply.
- package-lock.json is intentionally excluded to avoid the prior private-registry deployment error.
