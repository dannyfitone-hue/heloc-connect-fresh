HELOC CONNECT ENV DIAGNOSTIC FIX

This version adds:
  /api/env-check

After deploying, open:
  https://helocconnect.com/api/env-check

It will NOT reveal your full keys. It only shows:
- whether each variable exists
- length
- first characters
- last 4 characters
- whether it contains bullet/hidden characters

If hasBullet = true for any variable, delete and re-add that exact Vercel environment variable.

Important:
After changing Vercel env variables, always redeploy.
