# myn8n — n8n Self-Hosted Monorepo

Workflow automation stack corriendo en tu servidor propio, gestionado con PM2 detrás de HestiaCP.

## Stack

- **n8n** v2.20.0 (monorepo completo, ~18K archivos fuente)
- **PM2** — gestor de procesos (reinicio automático, logs)
- **HestiaCP** — proxy inverso nginx/apache en el frontend
- **Node.js** >= 22.16 | **pnpm** >= 10.22.0

## Endpoints

| Servicio | URL | Notas |
|---|---|---|
| Editor n8n | `http://217.216.43.75:2004/` | Puerto 2004, PM2 |
| Webhooks | `http://217.216.43.75:2004/` | WEBHOOK_URL configurado |
| Proxy público | `https://n8n.percyalvarez.lat/` | HestiaCP (HTTPS) |

## Gestión con PM2

```bash
# Ver estado
pm2 status

# Reiniciar n8n
pm2 restart n8n

# Ver logs en tiempo real
pm2 logs n8n --lines 50

# Tail de logs
tail -f logs/n8n-out.log
tail -f logs/n8n-error.log
```

## Build y deploy

```bash
# Tras un pull, reconstruir todo
pnpm install
pnpm build

# Reiniciar después de build
pm2 restart n8n
```

## Desarrollo local

```bash
# Backend completo (sin editor-ui)
pnpm dev:be

# Editor frontend
pnpm dev:fe:editor

# Construir n8n local (usa packages/cli/bin/n8n)
pnpm start
```

## Configuración

Variables de entorno clave (definidas en `ecosystem.config.js`):

- `N8N_PORT=2004`
- `N8N_PROTOCOL=http`
- `WEBHOOK_URL=http://217.216.43.75:2004/`
- `N8N_SECURE_COOKIE=false`

> HTTPS lo maneja HestiaCP, n8n corre sin TLS internamente.

## Estructura del monorepo

```
packages/
  cli/          # Entry point, REST API, webhooks
  core/         # Workflow execution engine
  workflow/     # TypeScript interfaces compartidas
  nodes-base/   # ~400 nodos pre-construidos
  frontend/
    editor-ui/  # Vue 3 workflow editor
    @n8n/design-system
```

## Notas

- `start-n8n.sh` usa `npx n8n@latest` (npm live), no el build local.
- Para correr desde el build local: `pnpm start` → `packages/cli/bin/n8n`
- `logs/` está en `.gitignore` — no se sube a GitHub