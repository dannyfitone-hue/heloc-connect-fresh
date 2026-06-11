HELOC CONNECT LEAD SUBMISSION VARCHAR FIX

The error:
Cannot convert argument to a ByteString because the character at index 16 has value 8226 which is greater than 255.

Fix included:
1. app/api/leads/route.ts sanitizes and trims submitted form fields.
2. supabase/schema.sql converts limited columns to text.

REQUIRED STEP:
Open Supabase > SQL Editor.
Paste and run the full contents of supabase/schema.sql.

Then:
1. Upload this ZIP to GitHub.
2. Commit.
3. Let Vercel redeploy.
4. Submit a test application again.
5. Check /owner.
