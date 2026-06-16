Based on exact good commit 85e076d07aede0e9450fdd080be379f6bd73bbd1.
Only fixed backend/admin functions:
- Owner dashboard now loads leads without relying on Supabase nested lender relationship.
- Owner dashboard normalizes client_token/property_address/monthly_income so submitted leads display correctly.
- Delete lead now deletes by lead id and ignores optional missing notes/documents tables.
- Added /api/owner/leads route for testing/loading/deleting leads.
- Disabled Twilio route so build does not require Twilio approval or package.
No homepage, calculator, layout, admin dashboard design, images, About page, or CSS redesign was intentionally changed.
