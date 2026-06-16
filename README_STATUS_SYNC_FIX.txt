HELOC CONNECT status sync fix

This build fixes lender/agent status updates so the same leads.status value used by the client status portal is updated directly.

What changed:
- /api/lenders/update now validates the lender/agent account, then updates leads.status, leads.updated_at, funded_amount, and funded_at when applicable.
- Client status API is forced dynamic/no-store so old status values are not cached.
- Client status page refreshes status automatically every 7 seconds and also loads with no-store.

Test after deploy:
1. Submit a client application and keep the /status/[token] page open.
2. Assign the lead to a mortgage company/agent in /owner.
3. Login at /lender-login.
4. Update the status from lender portal.
5. Refresh or wait up to 7 seconds on the client status page; the status bar should update.
