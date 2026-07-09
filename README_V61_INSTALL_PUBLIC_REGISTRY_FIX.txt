V61 deploy fix:
- Removed package-lock.json because prior lockfile contained internal OpenAI npm mirror URLs not reachable by Vercel.
- Replaced npm ci with npm install so Vercel resolves dependencies from public npm registry.
- Removed prefer-offline to prevent stale/unavailable cache behavior.
- Forced registry=https://registry.npmjs.org/ in both .npmrc and vercel.json install command.
