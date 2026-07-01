V40 Owner SMS Center Update

Added focused Owner Dashboard SMS tools without changing the homepage/calculator flow:

1. Automation Center now includes an Instant SMS panel.
   - Enter any phone number.
   - Type the SMS.
   - Send directly through Telnyx.
   - Redirects back with sent/failed status.

2. Each lead now includes an SMS Timeline panel.
   - Shows automatic SMS notes already stored on the lead.
   - Shows manual SMS logs if the optional sms_logs table exists.
   - Shows failed attempts and sent attempts.
   - Includes a manual Send SMS form directly inside each lead card.

3. Added API route:
   - POST /api/owner/instant-sms

4. Added optional Supabase SQL patch:
   - supabase/sms_logs_patch.sql

The app falls back to lead_notes if sms_logs is not created yet, so deployment will not break if the SQL patch has not been run.

Build tested successfully with Next.js.
