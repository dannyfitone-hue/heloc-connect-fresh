HELOC CONNECT - FINAL STATIC DEPLOYMENT ZIP

This package is ready for GitHub, Vercel, Netlify, or static hosting.

Files included:
- index.html
- about.html
- contact.html
- privacy-policy.html
- terms-and-conditions.html
- vercel.json
- netlify.toml

Deployment notes:
1. Upload all files into the root of your GitHub repository.
2. Do not upload the ZIP itself to GitHub; unzip first, then upload the files.
3. For Vercel/Netlify, set the project root to the folder containing index.html.
4. If your old live site is a React/Vite project, replace that project only if you want this static version to become the live site.

Official contact used:
clientservices@helocconnect.com

OWNER DASHBOARD SECURITY
------------------------
The owner and lender dashboard routes are now password protected.

Admin login URL:
https://www.helocconnect.com/owner-login

Owner dashboard URL after login:
https://www.helocconnect.com/owner

In Vercel, add this Environment Variable before deploying:
OWNER_DASHBOARD_PASSWORD=your-private-password-here

Then redeploy the project. Without this environment variable, the dashboard stays locked.
