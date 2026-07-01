HELOC CONNECT V35 SMS DEBUG/FIX

Changes made only for SMS reliability/debugging:
- Cleans accidental spaces/newlines from TELNYX_API_KEY, TELNYX_PHONE_NUMBER, TELNYX_MESSAGING_PROFILE_ID.
- Adds server runtime logs when welcome SMS is attempted, sent, skipped, or rejected by Telnyx.
- Keeps form submission logic and UI unchanged.
- /api/send-sms GET shows whether Telnyx env vars are visible to the deployment.
- /api/send-sms POST can still be used for manual server-side SMS testing.

After deploy: submit a form, then check Vercel Logs for:
HELOC_LEAD_SAVED_BEFORE_SMS
HELOC_SMS_ATTEMPT
HELOC_SMS_SENT or HELOC_SMS_TELNYX_ERROR
HELOC_WELCOME_SMS_RESULT
