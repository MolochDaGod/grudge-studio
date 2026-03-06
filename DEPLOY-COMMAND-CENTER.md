# Deploy Command Center to Puter

## Live URL
https://grudge-command-center.puter.site/

## Source
`apps/command-center/` — multi-file app (HTML, CSS, JS)

## Deploy with deploy-puter.mjs

The recommended deploy method uses the Puter SDK directly from Node.js, avoiding the puter-cli backslash bug on Windows.

```bash
node apps/command-center/deploy-puter.mjs
```

The script reads your Puter auth token from `%APPDATA%/puter-cli-nodejs/Config/config.json`, uploads all app files to `/command-center/` on Puter FS with forward slashes, and updates the hosted site.

## Manual Alternative (Puter File Manager)

1. Open https://puter.com and sign in
2. Upload the contents of `apps/command-center/` to a folder on Puter
3. Right-click the folder → "Host as Website"
4. Set subdomain to `grudge-command-center`

## Verify
- Visit https://grudge-command-center.puter.site/
- Should show sidebar nav, dashboard, and service health checks
- Sign in with Puter to enable KV, FS, and AI features
