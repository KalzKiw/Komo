# Despliegue en Proxmox LXC Debian 13

Esta guía documenta los pasos para desplegar KOMO/CafeteriaSolo desde cero en el contenedor LXC asignado en Proxmox.

## Datos del Entorno

- Contenedor: `3108 2DAM-GRUPO9-Alejandro`
- Sistema: Debian 13
- Aplicación: React + Vite + Express + Node.js
- Puerto interno de Node: `3001`
- Base de datos: Supabase/PostgreSQL externo
- Frontend de producción: `client-dist`, servido por Express

## Puertos Necesarios

Para una entrega pública se recomienda pedir al profesor apertura/redirección de:

- `80`: acceso web HTTP hacia Nginx dentro del contenedor.
- `443`: acceso HTTPS si se configura certificado.

Si solo permiten un puerto de prueba, se puede pedir un puerto externo redirigido al `3001` interno, aunque la opción recomendada para producción es Nginx en `80/443`.

Mensaje sugerido:

```text
Necesitamos abrir el puerto 80, y opcionalmente el 443, hacia el contenedor 3108 para servir la aplicación web KOMO mediante Nginx. La app Node queda internamente en el puerto 3001.
```

## 1. Actualizar el Sistema

Entrar en la consola del contenedor como `root` y ejecutar:

```bash
apt update
apt upgrade -y
apt install -y curl git nginx ca-certificates
```

## 2. Instalar Node.js

El proyecto usa React 19, Vite 8 y TypeScript. Se recomienda Node.js 22 LTS o superior.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
npm -v
```

## 3. Subir o Clonar el Proyecto

Crear una carpeta para la aplicación:

```bash
mkdir -p /var/www
cd /var/www
```

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO CafeteriaSolo
cd CafeteriaSolo
```

Si el repositorio es privado, también se puede subir el código por `scp` o copiar un `.zip` al contenedor y descomprimirlo en `/var/www/CafeteriaSolo`.

## 4. Instalar Dependencias

```bash
npm install
```

## 5. Configurar Variables de Entorno

Crear el archivo `.env`:

```bash
cp .env.example .env
nano .env
```

Contenido recomendado para producción:

```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=TU_ANON_KEY
STRIPE_SECRET_KEY=
VITE_API_BASE_URL=
VITE_STRIPE_PUBLISHABLE_KEY=
BYPASS_ORDER_CUTOFF=true
PRINTER_HOST=192.168.30.10
PRINTER_PORT=9100
PRINT_WORKER_ENABLED=false
PRINT_WORKER_INTERVAL_MS=5000
PRINT_WORKER_IGNORE_BEFORE=
```

Notas:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ANON_KEY` son obligatorias.
- `VITE_API_BASE_URL` debe quedarse vacío si Express sirve frontend y API desde el mismo dominio.
- `STRIPE_SECRET_KEY` y `VITE_STRIPE_PUBLISHABLE_KEY` solo son necesarias si se prueban pagos reales o de Stripe test.
- `BYPASS_ORDER_CUTOFF=true` es útil para demo porque evita que los horarios de pedido bloqueen pruebas.

## 6. Preparar Base de Datos

La base de datos está en Supabase. Antes de arrancar producción, aplicar:

1. `db/schema.sql`
2. `db/seed.sql`
3. Las migraciones necesarias de `db/migrations/`

Esto puede hacerse desde el SQL Editor de Supabase o con una herramienta PostgreSQL compatible.

## 7. Compilar el Proyecto

```bash
npm run build
```

Este comando genera:

- `dist/`: backend Express compilado.
- `client-dist/`: frontend React compilado.

## 8. Probar Manualmente Node

```bash
npm start
```

Comprobar desde el propio contenedor:

```bash
curl http://localhost:3001/api/health
```

Si responde correctamente, detener el proceso con `Ctrl+C`.

## 9. Crear Servicio systemd

Crear el servicio:

```bash
nano /etc/systemd/system/cafeteriasolo.service
```

Contenido:

```ini
[Unit]
Description=CafeteriaSolo KOMO Node.js App
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/CafeteriaSolo
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activar el servicio:

```bash
systemctl daemon-reload
systemctl enable cafeteriasolo
systemctl start cafeteriasolo
systemctl status cafeteriasolo
```

Ver logs:

```bash
journalctl -u cafeteriasolo -f
```

## 10. Configurar Nginx

Crear configuración:

```bash
nano /etc/nginx/sites-available/cafeteriasolo
```

Contenido:

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar:

```bash
ln -s /etc/nginx/sites-available/cafeteriasolo /etc/nginx/sites-enabled/cafeteriasolo
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 11. Comprobaciones Finales

Desde el contenedor:

```bash
curl http://localhost/api/health
curl http://localhost
```

Desde fuera, cuando el puerto esté abierto:

```text
http://IP_O_DOMINIO_ASIGNADO
```

Comprobar:

- La pantalla de login carga correctamente.
- El botón `Portfolio de Alejandro` abre `https://kalzdev.vercel.app/`.
- Los usuarios demo pueden iniciar sesión.
- El catálogo de productos carga desde Supabase.
- Se puede crear un pedido de prueba.
- `/api/health` responde correctamente.

## 12. Actualizar Nueva Versión

Cuando haya cambios en el código:

```bash
cd /var/www/CafeteriaSolo
git pull
npm install
npm run build
systemctl restart cafeteriasolo
systemctl status cafeteriasolo
```

## Solución de Problemas

Si falla por variables de entorno:

```bash
journalctl -u cafeteriasolo -n 80
```

Si el puerto `3001` está ocupado:

```bash
ss -tulpn | grep 3001
```

Si Nginx no responde:

```bash
nginx -t
systemctl status nginx
```

Si el frontend carga pero no hay productos, revisar:

- Variables de Supabase en `.env`.
- Tablas y datos aplicados en Supabase.
- Logs del servicio `cafeteriasolo`.
