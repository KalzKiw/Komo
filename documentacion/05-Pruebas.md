# Pruebas

## Estrategia de Testing

El proyecto combina pruebas automatizadas y validación manual funcional.

Las pruebas automatizadas actuales se centran en utilidades de negocio:

- Redondeo monetario con `roundMoney`.
- Cálculo de plazos de cancelación con `buildCancellationDeadline`.
- Lógica del sistema familiar.

Estas funciones son críticas porque afectan al total de pedidos, devoluciones y reglas horarias.

## Cómo Ejecutar Tests

```bash
npm test
```

Resultado actual:

- 3 ficheros de test.
- 11 pruebas superadas.

## Pruebas Manuales Realizadas

- Login con usuario alumno, familiar y administrador.
- Carga del catálogo de productos.
- Comprobación de que productos desactivados no aparecen en el menú de compra.
- Visualización de alérgenos.
- Apertura de ficha técnica de producto.
- Añadir productos al carrito.
- Confirmación de pedidos.
- Consulta de pedidos.
- Consulta de monedero y movimientos.
- Recarga familiar y flujo Stripe en modo test.
- Vinculación familiar mediante código.
- Panel de administración y KDS.
- Navegación móvil con botón atrás.
- Cambio de pestaña mediante gesto horizontal.
- Animaciones de deslizamiento entre vistas.
- APK Android de pruebas con API remota.
- Endpoint `/api/health` en producción.
- Build local y build de Vercel.

## Pruebas No Funcionales

- Comprobación de build de producción.
- Comprobación de que `.env` no se versiona.
- Revisión de errores de consola en despliegue.
- Corrección de service worker y cachés obsoletas.
- Revisión de contraste visual tras cambio de colores.
- Build Android con Capacitor y Gradle.
- Verificación de firma debug de la APK con `apksigner`.
- Comprobación de que la APK no depende de `localhost`.

## Limitaciones de Testing

- No existe todavía suite E2E completa con Playwright.
- No existe reporte formal de cobertura.
- No se han automatizado pruebas de carga.
- La impresión AVP-TC300 queda pendiente de validación física en la red local real.
