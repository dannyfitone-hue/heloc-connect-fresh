V38 SMS routing isolation test

Changes:
- Telnyx send payload now defaults to FROM NUMBER ONLY: { from, to, text }.
- It no longer sends messaging_profile_id by default because the phone number is already assigned to HELOC CONNECT SMS profile in Telnyx.
- Optional Vercel env TELNYX_SEND_MODE can be used for comparison:
  - from_only (default)
  - profile_only
  - both
- /api/send-sms GET now shows config status and supports direct test:
  /api/send-sms?send=1&to=19495551234

After deploying:
1. Submit a form again.
2. Also test /api/send-sms?send=1&to=YOURNUMBER
3. Check Telnyx Message Deliverability.

If messages still show 0 delivered / carrier error 40010, the remaining cause is almost certainly carrier/A2P 10DLC registration or Telnyx sender deliverability, not the app code.
