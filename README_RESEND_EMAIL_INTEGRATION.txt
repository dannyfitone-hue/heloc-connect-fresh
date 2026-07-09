HELOC CONNECT Resend Email Integration Added

This ZIP includes automatic email support through Resend.

What was added:
- lib/email.ts premium HELOC CONNECT branded email templates.
- Welcome email after client submits the application.
- Client portal link inside the welcome email.
- Admin new-lead notification email.
- Document request email when documents are requested.
- Status update email when owner/lender updates status.

Required Vercel environment variables:
- RESEND_API_KEY
- EMAIL_FROM=HELOC CONNECT <clientservices@helocconnect.com>
- ADMIN_EMAIL=clientservices@helocconnect.com
- NEXT_PUBLIC_SITE_URL=https://helocconnect.com

Email failures do not block lead submission. If email fails, the lead still saves and the failure is written to lead notes.
