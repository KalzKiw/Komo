# Pruebas

## Estrategia de Testing

El proyecto combina pruebas automatizadas y validación manual funcional.

Las pruebas automatizadas actuales se centran en utilidades de negocio:

- Redondeo monetario con `roundMoney`.
- Cálculo de plazos de cancelación con `buildCancellationDeadline`.

Estas funciones son críticas porque afectan al total de pedidos, devoluciones y reglas horarias.

## Cómo Ejecutar Tests

```bash
npm test
```

Resultado actual:

- 2 ficheros de test.
- 10 pruebas superadas.

## Pruebas Manuales Realizadas

- Login con usuario alumno, familiar y administrador.
- Carga del catálogo de productos.
- Visualización de alérgenos.
- Añadir productos al carrito.
- Confirmación de pedidos.
- Consulta de pedidos.
- Panel de administración y KDS.
- Endpoint `/api/health` en producción.
- Build local y build de Vercel.

## Pruebas No Funcionales

- Comprobación de build de producción.
- Comprobación de que `.env` no se versiona.
- Revisión de errores de consola en despliegue.
- Corrección de service worker y cachés obsoletas.
- Revisión de contraste visual tras cambio de colores.

## Limitaciones de Testing

- No existe todavía suite E2E completa con Playwright.
- No existe reporte formal de cobertura.
- No se han automatizado pruebas de carga.
