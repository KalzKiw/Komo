# CafeteriaSolo - Documentacion de la App

## 1. Resumen
CafeteriaSolo es una aplicacion para gestion de pedidos anticipados en cafeterias escolares.
Incluye:
- Backend API en Node.js + Express + TypeScript.
- Frontend web movil (HTML/CSS/JS) servido como estatico.
- Documentacion OpenAPI con Swagger UI.

## 2. Modulos principales
- Autenticacion por email (modo demo).
- App de alumno/familia:
  - ver perfil,
  - ver productos,
  - personalizar productos,
  - carrito,
  - crear pedidos,
  - ver y gestionar pedidos.
- Panel admin:
  - alumnos y delegados,
  - productos,
  - cola KDS.

## 3. Stack tecnico
- Node.js
- Express 4
- TypeScript
- Zod (validaciones)
- Supabase (persistencia)
- Swagger UI + swagger-jsdoc

## 4. Estructura relevante
- src/app.ts: arranque de middlewares, API y Swagger.
- src/server.ts: servidor HTTP.
- src/routes: rutas por dominio.
- src/controllers: controladores.
- src/services: logica de negocio.
- src/docs/openapi.ts: esquemas de OpenAPI.
- src/config/swagger.ts: configuracion Swagger.
- frontend/index.html: estructura de la app cliente.
- frontend/styles.css: estilos.
- frontend/app.js: estado y logica de interfaz.
- frontend/productInfo.ts: fichas sanitarias tipadas de productos.

## 5. Configuracion local
1. Copiar variables de entorno.
2. Instalar dependencias.
3. Levantar en modo desarrollo.

Ejemplo:

```bash
cp .env.example .env
npm install
npm run dev
```

Variables requeridas:
- PORT
- NODE_ENV
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## 6. Ejecucion y build
- Desarrollo: npm run dev
- Build: npm run build
- Produccion: npm run start

## 7. Swagger / OpenAPI
- URL local: http://localhost:3001/api-docs
- La API protegida usa cabecera x-user-role (no JWT real en este entorno).
- Valores permitidos de x-user-role:
  - ADMIN
  - STAFF
  - STUDENT
  - DELEGATE
  - PARENT

Cabeceras utiles para pruebas manuales:
- x-user-role: obligatorio en endpoints protegidos.
- x-user-id: opcional (si falta, se usa un UUID por defecto).
- x-user-beneficiary: opcional (true/false).

## 8. Endpoints principales
Auth:
- POST /api/auth/login

Health:
- GET /api/health

Main app:
- GET /api/me
- GET /api/products
- GET /api/me/orders
- GET /api/me/allergies

Orders:
- POST /api/orders
- GET /api/orders
- GET /api/orders/{orderId}
- DELETE /api/orders/{orderId}

Admin:
- GET /api/admin/students
- PATCH /api/admin/students/{studentId}/delegate
- GET /api/admin/kds
- GET /api/admin/products
- POST /api/admin/products
- PATCH /api/admin/products/{productId}

## 9. Flujo funcional resumido
1. Usuario inicia sesion.
2. Consulta perfil y catalogo.
3. Personaliza producto y agrega al carrito.
4. Crea pedido anticipado.
5. Consulta estado del pedido y puede cancelarlo segun reglas.
6. Admin monitoriza productos, estudiantes y cola KDS.

## 10. Estado actual de UI frontend
- Shell movil edge-to-edge.
- Header fijo con contenido scrolleable.
- Pantalla de Pedidos con filtros y detalle.
- Perfil simplificado para alumno.
- Modal de producto con enfoque de divulgacion progresiva:
  - alerta de alergenos,
  - resumen nutricional,
  - tabla nutricional completa bajo demanda,
  - ingredientes y conservacion.

## 11. Pendientes recomendados
- Unificar completamente frontend/productInfo.ts con el consumo runtime en frontend/app.js.
- Añadir tests de integracion de API.
- Mejorar ejemplos de request/response en Swagger para todos los endpoints.
- Definir estrategia real de autenticacion (JWT o sesion).
