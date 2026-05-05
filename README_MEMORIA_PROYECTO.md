# Resumen de Memoria del Proyecto - CafeteriaSolo / KOMO

La memoria académica completa está en [Memoria.md](Memoria.md). Este archivo resume el estado del proyecto y enlaza la documentación complementaria.

## Objetivo general

Entregar una plataforma funcional de cafetería escolar con:

- API Express estable, validada y documentada.
- Frontend React/Vite usable en móvil para alumnado y familias.
- Panel operativo para administración y KDS.
- Base de datos Supabase/PostgreSQL.
- Monedero, sistema familiar, alérgenos, Stripe en modo test y tickets.
- PWA instalable y APK Android generada con Capacitor.

## Estado final documentado

- Catálogo real de cafetería cargado y depurado.
- Productos desactivados ocultos en la vista de compra.
- Fichas técnicas alimentarias disponibles mediante datos de catálogo o fallback estimado.
- Gestos móviles y botón atrás adaptados en web/PWA/APK.
- Animaciones de deslizamiento entre pestañas y detalle de producto.
- APK de pruebas con nombre **KOMOAPK**, icono, pantalla completa y API remota.
- Tests Vitest actualizados: 3 ficheros y 11 pruebas superadas.

## Documentación principal

- [Memoria académica](Memoria.md)
- [Guía funcional y técnica](README_APP.md)
- [Documentación técnica](documentacion/01-Documentacion-Tecnica.md)
- [Manual de usuario](documentacion/09-Manual-Usuario.md)
- [Manual de administrador](documentacion/10-Manual-Administrador.md)
- [Explicación del ERD](documentacion/11-Explicacion-ERD.md)
- [Manual de desarrollador](documentacion/04-Manual-Desarrollador.md)
- [Pruebas](documentacion/05-Pruebas.md)
- [Despliegue](documentacion/06-Despliegue.md)
- [Changelog](documentacion/07-Changelog.md)
- [Android APK](documentacion/08-Android-APK.md)

## Pendientes relevantes

- Autenticación real de producción con Supabase Auth o JWT.
- Webhooks Stripe y conciliación final de pagos reales.
- Suite E2E completa con Playwright.
- Validación física de impresión en AVP-TC300.
- APK release firmada con keystore.
