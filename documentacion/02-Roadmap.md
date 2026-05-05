# Roadmap

## Fases del Proyecto

1. **Análisis y diseño**: definición del problema, roles, requisitos y modelo de datos.
2. **Backend principal**: API Express, validaciones, servicios y conexión con Supabase.
3. **Frontend consumidor**: catálogo, producto, carrito, pedidos, perfil y monedero.
4. **Módulo familiar**: vinculación, consulta de hijos y recarga de saldo.
5. **Panel administrador**: productos, pedidos, KDS, familias, delegados y settings.
6. **Alérgenos y seguridad alimentaria**: catálogo de alérgenos, avisos y gestión de perfil.
7. **Despliegue**: configuración de Vercel y alternativa Node.
8. **PWA y Android**: instalación web, service worker, Capacitor y APK.
9. **Documentación**: manuales, memoria y pruebas.

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
- [x] PWA instalable con manifest, iconos y service worker (2026-05-04).
- [x] APK Android debug generada con Capacitor y nombre KOMOAPK (2026-05-05).
- [x] API remota configurada para APK mediante `.env.android` (2026-05-05).
- [x] Navegación móvil con botón atrás, gestos y animaciones (2026-05-05).
- [x] Catálogo real revisado: 45 productos activos y desactivados ocultos en compra (2026-05-05).
- [x] Ficha técnica fallback para productos sin información extendida en producción (2026-05-05).
- [x] Tests Vitest actualizados: 3 ficheros, 11 pruebas (2026-05-05).
- [x] KDS rediseñado para tablet horizontal con estados operativos (2026-05-04).
- [x] Tickets de pedido con impresión AVP-TC300 y preview PDF de prueba (2026-05-04).
- [x] Flujo familiar con recarga confirmada y pago directo con tarjeta para importe exacto (2026-05-04).
- [x] Vinculación familiar completa con códigos (2026-05-01).
- [x] Panel de administración y KDS (2026-05-01).
- [x] Sistema de alérgenos basado en 14 alérgenos UE (2026-05-01).
- [x] Build compila backend y frontend (2026-05-01).
- [ ] Suite E2E automatizada.
- [ ] Autenticación real de producción.
- [ ] Validación en dispositivo real de impresora AVP-TC300.
- [ ] PWA offline avanzada con caché de datos.
- [ ] APK release firmada con keystore.

## Próximas Mejoras

### Corto plazo

- [x] Capturas finales en anexos (implementado con client-dist build).
- [x] Revisar todos los flujos en móvil real (funcional en producción).
- [x] Validar login, productos, pedidos y panel admin en despliegue.
- [x] Generar APK debug y verificar firma.
- [ ] Tests E2E con Playwright.
- [ ] Probar impresión real con la AVP-TC300 en red local.

### Medio plazo

- [ ] Implementar autenticación real con Supabase Auth o JWT.
- [ ] Añadir tests E2E con Playwright.
- [ ] Mejorar reporting de administración.
- [ ] Añadir control de stock.
- [ ] Aplicar migraciones pendientes de información extendida en producción.

### Largo plazo

- [ ] Ampliar pagos reales y conciliación bancaria.
- [ ] Notificaciones push.
- [ ] PWA offline estable para catálogos y pantalla KDS.
- [ ] Analítica de demanda y previsión avanzada.
- [ ] Publicación Android release.
