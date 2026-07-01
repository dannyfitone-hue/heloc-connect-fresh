DEPLOY FIX INCLUDED

The previous ZIP failed on Vercel because package-lock.json contained internal sandbox registry URLs:
internal sandbox registry

This ZIP removes that package-lock.json and adds a clean .npmrc pointing npm to the public registry:
https://registry.npmjs.org/

Upload this full ZIP to GitHub/Vercel and redeploy.
