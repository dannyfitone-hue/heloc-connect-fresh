Base: exact commit 85e076d07aede0e9450fdd080be379f6bd73bbd1 supplied by Daniel.

Changed only:
1) app/owner/page.tsx
   - Owner dashboard design preserved.
   - Fixed lead loading by removing the broken nested lender_users(*) relationship query.
   - Owner dashboard now loads directly from leads table.
2) app/api/owner/delete-lead/route.ts
   - Delete related lead_documents and lead_notes first, then delete the lead.
3) app/api/owner/leads/route.ts
   - Added API test endpoint for owner leads and DELETE support.
4) app/api/send-sms/route.ts
   - Twilio disabled. No Twilio import. Build will not fail because of Twilio.

Do not change homepage, about page, calculator, styling, images, or dashboard layout.
