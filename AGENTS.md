# AGENTS.md — n8n Self-Hosted Monorepo

## Project Overview

- **Name:** n8n-monorepo (source code, not npm package)
- **Version:** 2.20.0
- **Repo:** `/home/percyalvarez/web/n8n.percyalvarez.lat/public_html`
- **Engine:** Node.js >= 22.16 | pnpm >= 10.22.0 | pnpm@10.32.1 (locked)
- **Build:** Turbo 2.9.4 + pnpm workspaces + TypeScript + esbuild

## Deployment Context

n8n runs as a **PM2-managed process** behind HestiaCP's Apache/nginx reverse proxy.

### PM2 — `ecosystem.config.js`
```js
module.exports = {
  apps: [{
    name: 'n8n',
    script: '/usr/bin/n8n',
    args: 'start',
    env: {
      N8N_PORT: 2004,
      N8N_PROTOCOL: 'http',
      WEBHOOK_URL: 'http://217.216.43.75:2004/',
      N8N_SECURE_COOKIE: false
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: 'logs/n8n-error.log',
    out_file: 'logs/n8n-out.log'
  }]
};
```

### Start script — `start-n8n.sh`
```bash
#!/bin/bash
cd /home/percyalvarez/web/n8n.percyalvarez.lat/public_html
npx n8n@latest start --port 2004
```
> Note: The script uses `npx n8n@latest` (pulls latest from npm), NOT the local CLI build.

### Actual runtime
```
WEBHOOK_URL=http://217.216.43.75:2004/
N8N_PORT=2004
N8N_PROTOCOL=http
```
Webhooks and triggers will use the WEBHOOK_URL as base.

---

## Monorepo Structure

```
packages/
  cli/            # Entry point: bin/n8n, REST API (Express), auth, webhooks
  core/           # Workflow execution engine, active workflows, webhooks
  workflow/       # Shared TypeScript interfaces (front + back)
  nodes-base/     # ~400 pre-built nodes (HTTP, Discord, Gmail, Postgres, etc.)
  frontend/
    editor-ui/    # Vue 3 workflow editor (Vite, Pinia, Vue Router)
    @n8n/design-system  # Vue component library (Element Plus based)
    @n8n/chat/    # Chat widget
  node-dev/       # CLI: pnpm start to scaffold new nodes
  extensions/
  testing/        # Test infrastructure (Playwright, Jest, testcontainers)

packages/@n8n/    # Internal packages (config, AI nodes, Mastra integration)
```

### Key dependencies (catalog versions from `pnpm-workspace.yaml`)
- **LangChain:** 1.2.30 + `@langchain/core` 1.1.41
- **Mastra AI:** `@mastra/core` 1.17.0
- **Multi-provider AI:** `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/amazon-bedrock`, etc.
- **DB:** TypeORM 0.3.20-16, PostgreSQL, SQLite3
- **Testing:** Vitest 4.1.1, Playwright 1.58.0, testcontainers 11.13.0
- **Frontend:** Vue 3.5, Element Plus 2.4.3, Pinia, Vite 8.0

---

## Package Manager Conventions

### pnpm workspace catalogs
Versions are centralized in `pnpm-workspace.yaml` under `catalog:`.
```yaml
catalog:
  lodash: 4.18.1
  vue: ^3.5.13
  # ...
```
Packages reference catalogs, not hardcoded versions:
```json
"lodash": "catalog:"
```

### Build order (Turbo pipeline)
```
workflow → core → nodes-base → cli → frontend
```

### Key scripts (`package.json` root)
```bash
pnpm build              # turbo run build (full monorepo)
pnpm build:n8n          # node scripts/build-n8n.mjs
pnpm dev                # turbo dev (parallel, excludes design-system/chat/task-runner)
pnpm dev:be             # backend only (excludes n8n-editor-ui)
pnpm dev:fe             # frontend only
pnpm dev:fe:editor      # editor-ui only
pnpm dev:ai              # AI nodes + n8n + core
pnpm dev:e2e             # pnpm --filter=n8n-playwright dev --ui
pnpm test                # Jest across all packages
pnpm test:ci             # sequential, continue on failure
pnpm test:ci:backend     # all non-frontend tests
pnpm test:ci:frontend    # frontend tests only
pnpm lint                # turbo lint
pnpm typecheck           # turbo typecheck
pnpm start               # node scripts/os-normalize.mjs --dir packages/cli/bin n8n
pnpm webhook             # ./packages/cli/bin/n8n webhook
pnpm worker              # ./packages/cli/bin/n8n worker
pnpm dev:computer-use    # pnpm --filter @n8n/computer-use build && node .../cli.js serve
```

---

## Environment Variables

No `.env.local` is present. Env vars come from:
1. PM2 `ecosystem.config.js` (inline `env`)
2. System environment
3. DotEnvx (for dev): `dotenvx run -f .env.local -- pnpm dev:be`

See `.env.local.example` for all available vars. Key ones:
```
N8N_USER_FOLDER        # local data dir
N8N_AI_ENABLED         # enable/disable AI features
N8N_AI_ANTHROPIC_KEY   # Anthropic API key for AI workflow builder
WEBHOOK_URL            # public URL for triggers (critical!)
N8N_LICENSE_TENANT_ID  # self-hosted license
N8N_LICENSE_ACTIVATION_KEY
```

---

## Key Constraints

- Running as **HestiaCP client user** (`percyalvarez`), not root/admin
- Group: `www-data` for web serving
- **WEBHOOK_URL must match external address** — triggers fail silently if misconfigured
- `N8N_SECURE_COOKIE: false` — cookie security relaxed (behind proxy)
- **No TLS at n8n level** — HestiaCP handles HTTPS termination
- `start-n8n.sh` uses `npx n8n@latest` — live npm version, NOT local build
- For local dev build: use `pnpm start` which calls `packages/cli/bin/n8n`

---

## Common Operations

### Restart n8n
```bash
pm2 restart n8n
pm2 logs n8n --lines 50
```

### Check status
```bash
pm2 status
pm2 list
```

### Full rebuild after pull
```bash
cd /home/percyalvarez/web/n8n.percyalvarez.lat/public_html
pnpm install
pnpm build
pm2 restart n8n
```

### Tail logs
```bash
tail -f logs/n8n-out.log
tail -f logs/n8n-error.log
```

### Run from local build (not npx)
```bash
pnpm start  # uses packages/cli/bin/n8n
```

---

## Frontend Development

When working on `editor-ui` or `design-system`:

- **Dev:** `pnpm dev:fe` (Vite + hot reload)
- **Style tokens:** `@n8n/design-system/src/css/_tokens.scss` (semantic)
  - AVOID `_tokens.legacy.scss`
- **Icons:** keys from `updatedIconSet` only in `design-system/src/components/N8nIcon/icons.ts`
- **Debounce constants:** `@/app/constants/durations` (don't hardcode)
- **Components:** always prefer existing design-system components before creating new ones
- **Format:** Biome (`biome.jsonc`), Prettier for general code

### Frontend AGENTS.md detail (`packages/frontend/AGENTS.md`)
See `packages/frontend/AGENTS.md` for Vue-specific conventions.

---

## Node Development (`nodes-base`)

The `packages/nodes-base/AGENTS.md` contains full guidance:
- Node types: programmatic (`execute`), declarative (routing), triggers (webhook/polling/generic)
- Parameters: `string`, `options`, `resourceLocator`, `collection`, `fixedCollection`
- Versioning: light (`version: [3, 3.1, 3.2]`) or full (`VersionedNodeType`)
- Credentials: `ICredentialType` in `credentials/` dir
- Testing: `NodeTestHarness` + `nock` for HTTP mocking

### Quick node scaffold
```bash
pnpm --filter @n8n/node-dev start
```

---

## Testing

```bash
pnpm test                                    # All packages
pnpm test:ci                                 # Sequential, keep going
pnpm test:ci:backend                         # Non-frontend only
pnpm test:affected                           # Only changed packages
pnpm --filter=n8n-playwright test:container:standard  # E2E in Docker
pnpm test:show:report                        # View Playwright report
```

---

## Notable Patches (`patches/`)

These packages are patched via `pnpm.patchedDependencies`:
- `bull@4.16.4` — queue library
- `pdfjs-dist@5.3.31` — PDF rendering
- `element-plus@2.4.3` — Vue component library
- `ics` — calendar feed parsing
- `v-code-diff` — diff viewer component
- `assert@2.1.0` — Node assertion library

---

## CI/CD Tools in Use

- **Turbo** — build orchestrator (`.turbo/`, `turbo.json`)
- **Biome** — linting + formatting (`biome.jsonc`)
- **Prettier** — code formatting (`.prettierrc.js`)
- **Lefthook** — git hooks (`.lefthook.yml`)
- **Renovate** — dependency updates (`renovate.json`)
- **Codecov** — coverage tracking (`codecov.yml`)
- **Poutine** — OCLIF-based CLI for releases (`.poutine.yml`)
- **Cubic** — release process management (`cubic.yaml`)

---

## User Context

- Spanish-speaking, manages HestiaCP v1.9.4 on Ubuntu 24.04
- Technical, understands Linux permissions (group model)
- Setting up Hestia CLI for non-admin users (v-* commands for client accounts)
- Prefers concise answers + direct execution; asks before destructive changes
