HELOC CONNECT ADMIN/LENDER ASSIGNMENT FIX

Added:
- Admin can create lender users.
- Lender users login with their created email and password.
- Admin can assign leads to a lender.
- Lender portal only shows leads assigned to that lender user.
- Admin can delete any lead.
- Admin can update client status.
- Lender can update status for assigned leads.
- Updated Supabase schema adds lender_users and assigned_lender_id.

Required:
Run supabase/schema.sql in Supabase SQL Editor after uploading.

Important URLs:
Admin login: /owner-login
Admin dashboard: /owner
Lender login: /lender-login
Lender dashboard: /lender
