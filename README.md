# n8n Self-Hosted Monorepo

Workflow automation platform — n8n v2.20.0 source code, ready for self-hosted deployment.

## Requisitos

- **Node.js** >= 22.16
- **pnpm** >= 10.22.0
- **PM2** — process manager
- Proxy inverso (nginx, Apache, HestiaCP, etc.) para HTTPS

## Deploy en un VPS nuevo

```bash
# 1. Clonar el repo
git clone https://github.com/tu-user/myn8n.git
cd myn8n

# 2. Instalar pnpm y dependencias
npm install -g pnpm
pnpm install

# 3. Build del monorepo
pnpm build

# 4. Configurar .env o ecosystem.config.js con los valores de tu VPS
#    (ver sección Configuración más abajo)

# 5. Iniciar con PM2
pm2 start ecosystem.config.js
```

## Configuración

### ecosystem.config.js

```js
module.exports = {
  apps: [{
    name: 'n8n',
    script: '/usr/bin/n8n',
    args: 'start',
    env: {
      N8N_PORT: 2004,
      N8N_PROTOCOL: 'http',
      WEBHOOK_URL: 'http://tu-ip-o-dominio:2004/',
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

### Variables clave

| Variable | Descripción |
|---|---|
| `N8N_PORT` | Puerto interno donde corre n8n |
| `N8N_PROTOCOL` | `http` (TLS lo maneja el proxy) |
| `WEBHOOK_URL` | URL pública para webhooks — DEBE coincidir con el acceso externo |
| `N8N_SECURE_COOKIE` | `false` si estás detrás de un proxy sin TLS a nivel n8n |

> HTTPS se maneja en el proxy inverso, n8n corre sin TLS internamente.

## Gestión con PM2

```bash
pm2 status              # Ver estado
pm2 restart n8n         # Reiniciar
pm2 logs n8n --lines 50 # Ver logs
tail -f logs/n8n-out.log # Tail logs
```

## Desarrollo local

```bash
pnpm install            # Instalar todo
pnpm build              # Build completo
pnpm dev:be             # Backend (sin editor-ui)
pnpm dev:fe:editor      # Editor frontend
pnpm start              # Usar build local (packages/cli/bin/n8n)
```

## Testing

```bash
pnpm test               # Todos los tests
pnpm test:ci            # Modo CI (secuencial)
pnpm test:affected      # Solo paquetes cambiados
```

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

- `start-n8n.sh` puede usar `npx n8n@latest` (npm) o el build local
- `pnpm start` usa el build local: `packages/cli/bin/n8n`
- `logs/` está en `.gitignore` — no se sube
