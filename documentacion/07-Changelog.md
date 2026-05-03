# Changelog

## 2026-05-03

### Añadido

- Persistencia de teléfono y tarjeta resumida en el perfil del usuario.
- Endpoint de recarga real del monedero del alumno y movimientos `wallet_transactions`.
- Migración `20260503_wallet_profile_persistence.sql` para perfil persistente y movimientos de monedero.
- Ficha alimentaria e imagen editable desde el panel de administración.
- Switch temporal en Administración para desactivar los límites de reserva.

### Corregido

- El monedero del alumno ya no suma saldo solo en React: la recarga actualiza el backend.
- El input de recarga se sustituyó por un control móvil con botones de incremento/decremento.
- Alumno demo y padre demo quedan vinculados por seed/fallback de demo.
- Horarios de corte ajustados a mañana 09:00, tarde 15:00 y noche 18:00, sin minutos de gracia por defecto.

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
