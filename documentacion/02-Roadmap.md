# Roadmap

## Fases del Proyecto

1. **Análisis y diseño**: definición del problema, roles, requisitos y modelo de datos.
2. **Backend principal**: API Express, validaciones, servicios y conexión con Supabase.
3. **Frontend consumidor**: catálogo, producto, carrito, pedidos, perfil y monedero.
4. **Módulo familiar**: vinculación, consulta de hijos y recarga de saldo.
5. **Panel administrador**: productos, pedidos, KDS, familias, delegados y settings.
6. **Alérgenos y seguridad alimentaria**: catálogo de alérgenos, avisos y gestión de perfil.
7. **Despliegue**: configuración de Vercel y alternativa Node.
8. **Documentación**: manuales, memoria y pruebas.

## Estado Actual

- [x] Documentación técnica revisada.
- [x] Manual de usuario actualizado.
- [x] Manual de desarrollador actualizado.
- [x] Documentación de pruebas y despliegue.
- [x] Memoria final creada.
- [x] Build de frontend y backend.
- [x] Deploy en Vercel con frontend funcionando.
- [x] API accesible mediante `/api/health`.
- [x] Correcciones visuales de colores, fuente y tarjetas.
- [x] Persistencia de teléfono y tarjeta en perfil (2026-05-03).
- [x] Recarga real del monedero con wallet_transactions (2026-05-03).
- [x] Sistema de monedero completo con movimientos (2026-05-03).
- [x] Gestión de productos con ficha alimentaria e imagen editable (2026-05-03).
- [x] Switch para desactivar límites de reserva temporalmente (2026-05-03).
- [x] Vinculación familiar completa con códigos (2026-05-01).
- [x] Panel de administración y KDS (2026-05-01).
- [x] Sistema de alérgenos basado en 14 alérgenos UE (2026-05-01).
- [x] Build compila backend y frontend (2026-05-01).
- [ ] Suite E2E automatizada.
- [ ] Autenticación real de producción.
- [ ] Pago real o integración bancaria segura.
- [ ] PWA offline con caché versionada.

## Próximas Mejoras

### Corto plazo

- [x] Capturas finales en anexos (implementado con client-dist build).
- [x] Revisar todos los flujos en móvil real (funcional en producción).
- [x] Validar login, productos, pedidos y panel admin en despliegue.
- [ ] Tests E2E con Playwright.

### Medio plazo

- [ ] Implementar autenticación real con Supabase Auth o JWT.
- [ ] Añadir tests E2E con Playwright.
- [ ] Mejorar reporting de administración.
- [ ] Añadir control de stock.

### Largo plazo

- [ ] Pasarela de pago real.
- [ ] Notificaciones push.
- [ ] PWA offline estable.
- [ ] Analítica de demanda y previsión avanzada.
