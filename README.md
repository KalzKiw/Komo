# CafES APP Backend

Backend base para gestion de pedidos anticipados, reglas de negocio escolares y KDS.

Documentacion ampliada:
- Guia funcional y tecnica: README_APP.md
- Memoria diaria del proyecto: README_MEMORIA_PROYECTO.md

## Estructura de carpetas

```text
.
├── db
│   ├── erd.mmd
│   └── schema.sql
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── config
│   │   ├── env.ts
│   │   ├── supabase.ts
│   │   └── swagger.ts
│   ├── controllers
│   │   ├── health.controller.ts
│   │   └── orders.controller.ts
│   ├── docs
│   │   └── openapi.ts
│   ├── middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── order-time-window.middleware.ts
│   ├── routes
│   │   ├── health.routes.ts
│   │   ├── index.ts
│   │   └── orders.routes.ts
│   ├── services
│   │   └── order.service.ts
│   ├── types
│   │   ├── domain.ts
│   │   └── express.d.ts
│   └── validators
│       └── order.validator.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Arranque

```bash
npm install
npm run dev
```

Swagger disponible en `http://localhost:3001/api-docs`.

Nota: en el entorno actual los endpoints protegidos usan la cabecera `x-user-role` (autenticacion mock para desarrollo).

## Migraciones

Si ya tenias la base creada antes de esta version, aplica:

```sql
\i db/migrations/20260325_order_items_customizations.sql
```
