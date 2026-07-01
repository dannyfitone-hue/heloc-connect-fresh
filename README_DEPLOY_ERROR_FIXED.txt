DEPLOY FIX INCLUDED

The previous ZIP failed on Vercel because package-lock.json contained internal sandbox registry URLs:
packages.applied-caas-gateway1.internal.api.openai.org

This ZIP removes that package-lock.json and adds a clean .npmrc pointing npm to the public registry:
https://registry.npmjs.org/

Upload this full ZIP to GitHub/Vercel and redeploy.
