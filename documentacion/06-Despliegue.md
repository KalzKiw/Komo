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
- `VITE_STRIPE_PUBLISHABLE_KEY` si se habilitan pagos Stripe en cliente.
- `STRIPE_SECRET_KEY` si se habilitan pagos Stripe en backend.

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

## Despliegue para APK Android

La APK no puede usar `localhost` ni el proxy de Vite. Antes de compilar Android, configura `.env.android` con una API pública:

```bash
VITE_API_BASE_URL=https://cafeteriappsolo-production.up.railway.app
```

Después genera la APK:

```bash
npm run android:apk:debug
```

El archivo queda en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Para distribución real hace falta una build release firmada con keystore.

## Checklist de Publicación

- [x] Variables configuradas.
- [x] `.env` fuera del repositorio.
- [x] Build cliente verificado.
- [x] Build backend verificado.
- [x] Tests automatizados pasados.
- [x] APK debug generada y firma verificada.
- [x] Endpoint `/api/health` validado.
- [x] PWA validada con manifest, iconos y service worker versionable.
- [x] API remota validada para uso desde APK.
- [ ] Prueba física de impresión en AVP-TC300 dentro de la red local.
- [ ] Pruebas E2E automatizadas.
- [ ] APK release firmada.
