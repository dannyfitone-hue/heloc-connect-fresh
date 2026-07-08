HELOC CONNECT - Compare Monthly Payments Update

Added a clean payment comparison module inside the estimated preview area.

What changed:
- Added a "Compare Payments" button below the preview cards for HELOC/refinance/equity-line flows.
- When clicked, it expands a premium comparison panel showing:
  - HELOC option total monthly payment = current mortgage payment + estimated new HELOC payment.
  - Refinance option total monthly payment = new refinance mortgage payment, based on existing loans plus requested cash.
  - A simple lower-payment result showing which option is estimated lower and by how much.
- Added hidden lead fields for:
  - heloc_total_monthly_payment
  - refinance_total_monthly_payment
  - lower_payment_option
- The compare panel resets when a client switches products.

Validation:
- TypeScript check completed successfully with: tsc --noEmit
