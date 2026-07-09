V60 deploy install fix

Changes:
- Switched Vercel install command from npm install to npm ci for stable lockfile-based installs.
- Added npm retry/timeouts and legacy-peer-deps in .npmrc.
- Kept existing build command and application code unchanged.

If Vercel still shows npm install --legacy-peer-deps in logs, open Vercel Project Settings > Build & Development Settings > Install Command and set it to:
npm ci --legacy-peer-deps --no-audit --no-fund

Then redeploy.
