HELOC CONNECT OFFICE HERO VERIFIED PACKAGE

This package was created from the uploaded current project and verified before zipping.

Verified changes:
- app/page.tsx references /heloc-office-consultation.png for the main hero image.
- app/page.tsx does not reference /hero-couple-clean.png, /happy-couple-success.png, or /happy-couple-tablet.png.
- All old couple-image filenames in /public have been overwritten with the same office consultation image as a safety fallback.
- Root static HTML fallback files were removed so Vercel uses the Next.js app router source.
- The only live-agent call CTA in app/page.tsx links to tel:+19498662466.

Important deployment note:
Deploy this folder as the root Next.js project containing package.json, app/, public/, lib/, middleware.ts, etc.
