# Despliegue

## Despliegue en Vercel

El proyecto está preparado para desplegar el frontend en Vercel y servir API mediante una única función serverless.

Configuración principal:

- Archivo: `vercel.json`.
- Build command: `npm run build:client`.
- Output directory: `client-dist`.
- Rewrite `/api/*` hacia `api/index.ts`.
- Fallback de rutas SPA hacia `index.html`.

Variables necesarias:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `NODE_ENV=production`
- `BYPASS_ORDER_CUTOFF=true` si se desea evitar cierre horario durante demo.
- `VITE_API_BASE_URL` vacío si API y frontend comparten dominio.

## Despliegue como Servicio Node

También puede desplegarse como app Node tradicional.

```bash
npm install
npm run build
npm start
```

En este modo:

- `dist/server.js` arranca Express.
- `client-dist` se sirve como frontend estático.
- `/api` queda servido por Express.

## Checklist de Publicación

- [x] Variables configuradas.
- [x] `.env` fuera del repositorio.
- [x] Build cliente verificado.
- [x] Build backend verificado.
- [x] Tests automatizados pasados.
- [x] Endpoint `/api/health` validado.
- [x] PWA validada con manifest, iconos y service worker versionable.
- [ ] Prueba física de impresión en AVP-TC300 dentro de la red local.
- [ ] Pruebas E2E automatizadas.
