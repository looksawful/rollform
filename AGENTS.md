# Agent notes

- Editable source of truth: `main`. `gh-pages` is generated output, never edit it by hand.
- One publish path: `.github/workflows/publish.yml` runs test, typecheck, static build and deploy after a push to `main`.
- Verify locally: `npm ci && npm test && npm run typecheck && npm run build`.
- Demo only: no confirmed stock, prices, checkout, received orders, contact collection or analytics.
- Pending technical acceptance and evidence: https://github.com/looksawful/rollform-internal/issues/5
- Do not create parallel specifications, duplicated Issues or extra state-management layers.
