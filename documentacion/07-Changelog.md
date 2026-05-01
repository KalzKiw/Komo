# Changelog

## 2026-05-01

### Añadido

- Frontend React/Vite como cliente principal.
- API Express conectada a Supabase.
- Despliegue Vercel con `client-dist`.
- Función serverless única para redirigir `/api/*` al backend Express.
- Sistema de alérgenos completo basado en los 14 alérgenos principales de la UE.
- Gestión familiar con códigos de vinculación.
- Panel de administración, KDS y previsión.

### Cambiado

- `npm run build` compila backend y frontend.
- Vite lee variables desde la raíz del proyecto.
- Se normalizaron colores Tailwind con sintaxis válida `[#hex]`.
- Se fijó tipografía global para mayor consistencia entre móvil y escritorio.
- Se alinearon tarjetas de productos con altura uniforme.

### Corregido

- Error de Vercel por output directory incorrecto.
- Error MIME de assets por rewrite demasiado amplio.
- Service worker antiguo que interceptaba recursos.
- Error de Railway/Node por import runtime de un archivo `.d.ts`.
- Límite de funciones serverless de Vercel Hobby.
