Fixes lender creation not adding new users by replacing Supabase upsert/onConflict with check-email-then-update-or-insert. No design changes.
