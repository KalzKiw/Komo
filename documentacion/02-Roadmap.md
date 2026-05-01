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
- [ ] Suite E2E automatizada.
- [ ] Autenticación real de producción.
- [ ] Pago real o integración bancaria segura.
- [ ] PWA offline con caché versionada.

## Próximas Mejoras

### Corto plazo

- Añadir capturas finales en anexos.
- Revisar todos los flujos en móvil real.
- Validar login, productos, pedidos y panel admin tras cada despliegue.

### Medio plazo

- Implementar autenticación real con Supabase Auth o JWT.
- Añadir tests E2E con Playwright.
- Mejorar reporting de administración.
- Añadir control de stock.

### Largo plazo

- Pasarela de pago real.
- Notificaciones push.
- PWA offline estable.
- Analítica de demanda y previsión avanzada.
