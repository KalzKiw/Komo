# Demo pública para portfolio (Vercel)

La demo pública puede ejecutarse enteramente en el navegador con datos ficticios. No necesita Supabase, Stripe ni impresora y, por tanto, no se pausa.

## 1. Importar el repositorio en Vercel

El repositorio ya incluye `vercel.json`. En Project Settings > Environment Variables añade:

```text
NODE_ENV=production
VITE_DEMO_MODE=true
```

No configures claves de Supabase, Stripe ni una impresora en la demo.

## 2. Publicar

Haz Deploy y prueba los accesos rápidos Alumno, Padre y Admin. En modo demo:

- el login solo acepta las tres cuentas ficticias con contraseña interna `demo`;
- los pedidos se simulan sin guardarse ni cobrar;
- registro, pagos, impresión y escrituras administrativas están bloqueados;
- todas las consultas e interacciones se simulan localmente en el navegador.

Usa la URL de producción de Vercel como destino del botón de tu portfolio.
