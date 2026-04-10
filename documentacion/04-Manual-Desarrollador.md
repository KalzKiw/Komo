# 🛠️ Manual de Desarrollador

## Funcionalidades

- **Autenticación de usuarios:** Registro, login, recuperación de contraseña y gestión de sesiones.
- **Gestión de perfiles familiares:** Permite añadir hijos o familiares, configurar restricciones alimentarias y gestionar el saldo del monedero.
- **Catálogo de productos:** Visualización de productos, detalles, alérgenos y personalizaciones.
- **Carrito y pedidos:** Añadir productos al carrito, confirmar pedidos, historial y notificaciones de estado.
- **Panel de administración:** Gestión de productos, usuarios y configuración general (si aplica).
- **PWA:** Instalación en dispositivos, funcionamiento offline y notificaciones push.

---

## Levantar entorno local
1. Clona el repositorio:
	```bash
	git clone <url-repositorio>
	```
2. Instala dependencias:
	```bash
	npm install
	```
3. Configura las variables de entorno:
	- Crea un archivo `.env` en la raíz con las variables necesarias (ver documentación técnica).
4. Ejecuta la app en modo desarrollo:
	```bash
	npm run dev
	```
5. Accede a `http://localhost:5173` en tu navegador.

---

## Scripts útiles
- `npm run dev` — Levanta el entorno de desarrollo.
- `npm run test` — Ejecuta los tests.
- `npm run build` — Genera la build de producción.
- `npm run lint` — Linter para mantener el código limpio.

---

## Buenas prácticas
- Realiza commits claros y descriptivos.
- Usa ramas para nuevas funcionalidades o correcciones.
- Haz pull requests y solicita revisión antes de fusionar.
- Mantén la documentación actualizada.
- Escribe tests para nuevas funcionalidades.

---

## Estructura de carpetas relevante
- `/client`: Frontend principal (React)
- `/src`: Backend (Node.js/Express)
- `/db`: Migraciones y seeds
- `/frontend`: Versión legacy o experimental

---

## Variables de entorno
Consulta el archivo `.env.example` o la documentación técnica para conocer y configurar las variables necesarias (API keys, URL de la base de datos, etc).

---

## Contacto y soporte
Para dudas técnicas, contacta con el responsable del proyecto o abre un issue en el repositorio.
