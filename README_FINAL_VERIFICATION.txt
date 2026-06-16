HELOC CONNECT FINAL FIX VERIFICATION

- app/page.tsx uses /heloc-office-consultation-final.png?v=final-office-20260608
- public/heloc-office-consultation-final.png is the office consultation image with HELOC CONNECT logo wall.
- old couple image filenames are still present only as fallback assets; app/page.tsx does NOT reference them.
- ZIP is packaged with project files at the root (package.json at top level), not nested inside another folder.
