HELOC CONNECT PREMIUM PORTALS FIX

This version replaces the placeholder portal pages with premium HELOC CONNECT layouts:

- /owner
  Premium admin dashboard with stats, lead cards, lead details, client status update form.

- /lender
  Premium mortgage company/agent dashboard with lead pipeline cards and status update control.

- /status/[token]
  Premium client status page with timeline and application snapshot.

Also includes:
- /api/owner/update-status
  Updates Supabase lead status and notes. Status page reflects changes.

Deploy:
1. Upload this ZIP contents to GitHub repo.
2. Commit.
3. Let Vercel deploy.
4. Submit test lead.
5. Check /owner, /lender, and the /status/[token] page.
