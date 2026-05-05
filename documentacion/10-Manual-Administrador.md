# Manual de Administrador - KOMO

Este manual describe el uso del panel de administración de KOMO para gestionar la operativa de cafetería escolar: productos, pedidos, KDS, estudiantes, familias, horarios y tickets.

## 1. Acceso al panel

Para acceder al panel de administración:

1. Abrir la aplicación.
2. Iniciar sesión con una cuenta con rol `ADMIN` o perfil equivalente.
3. Acceder a la vista de administración.

Usuario demo habitual:

```text
admin1@cafes.app
```

## 2. Objetivo del panel

El panel permite controlar la operación diaria de cafetería:

- Ver pedidos activos.
- Cambiar estados de pedidos.
- Consultar la cola de cocina.
- Gestionar productos.
- Activar o desactivar artículos del menú.
- Revisar previsión de producción.
- Gestionar estudiantes y delegados.
- Revisar relaciones familiares.
- Configurar horarios de corte.
- Probar tickets de cocina.

## 3. Vista general de administración

El panel se organiza por secciones o pestañas. Las más importantes son:

- Previsión.
- KDS.
- Pedidos.
- Productos.
- Estudiantes.
- Familias.
- Ajustes.

La disponibilidad exacta puede depender del rol del usuario.

## 4. Gestión de productos

La sección de productos permite mantener actualizado el catálogo de cafetería.

Acciones disponibles:

- Consultar productos existentes.
- Crear productos nuevos.
- Editar nombre, precio, categoría y descripción.
- Asignar alérgenos.
- Añadir o editar información alimentaria.
- Activar o desactivar productos.

Los productos desactivados no aparecen en el menú de compra del alumnado.

## 5. Crear un producto

Para crear un producto:

1. Entrar en **Administración > Productos**.
2. Pulsar la acción de crear producto.
3. Completar nombre, categoría y precio.
4. Añadir alérgenos si corresponde.
5. Completar información alimentaria si está disponible.
6. Guardar.

Recomendación: revisar el producto desde la vista de alumno para comprobar que aparece correctamente.

## 6. Editar un producto

Para modificar un producto:

1. Entrar en la lista de productos.
2. Seleccionar el producto.
3. Cambiar los datos necesarios.
4. Guardar.

Cambios habituales:

- Precio.
- Nombre visible.
- Categoría.
- Alérgenos.
- Estado activo/inactivo.

## 7. Activar y desactivar productos

La desactivación sirve para ocultar productos temporalmente sin borrarlos.

Casos de uso:

- Producto agotado.
- Producto no disponible ese día.
- Producto pendiente de revisión.
- Error detectado en precio o ficha.

Cuando un producto está desactivado, no aparece en el catálogo de compra, pero puede seguir existiendo en administración para futuras reactivaciones.

## 8. Gestión de pedidos

La sección de pedidos permite revisar la actividad operativa.

Se pueden consultar:

- Pedidos pendientes.
- Pedidos en preparación.
- Pedidos listos.
- Pedidos entregados.
- Pedidos cancelados.

También se puede abrir el detalle de cada pedido para ver productos, extras, notas y total.

## 9. Cambiar estado de pedido

El flujo habitual es:

1. `PENDING`: pedido recibido.
2. `IN_PREPARATION`: pedido en cocina.
3. `READY`: pedido listo para recoger.
4. `DELIVERED`: pedido entregado.

Si el pedido se anula, pasa a:

```text
CANCELLED
```

El cambio de estado ayuda al alumnado y al personal de cafetería a saber en qué punto está cada pedido.

## 10. KDS o cola de cocina

El KDS está pensado para cocina o mostrador, especialmente en tablet horizontal.

Su objetivo es mostrar de forma clara:

- Pedidos entrantes.
- Pedidos en preparación.
- Pedidos listos.
- Productos de cada pedido.
- Extras o personalizaciones.
- Ingredientes retirados.
- Notas de cocina.

Uso recomendado:

1. Abrir el KDS antes del recreo o turno de servicio.
2. Mantenerlo visible en cocina.
3. Cambiar pedidos a preparación cuando se empiecen.
4. Marcar pedidos como listos al terminarlos.
5. Marcar entregados cuando el alumno recoja.

## 11. Previsión de producción

La previsión ayuda a anticipar demanda.

Puede utilizarse para:

- Identificar productos más pedidos.
- Preparar con antelación.
- Reducir esperas.
- Evitar exceso o falta de producción.

En un MVP, esta pantalla sirve como apoyo operativo. En una versión futura podría incluir informes más avanzados.

## 12. Gestión de estudiantes

La sección de estudiantes permite revisar usuarios con rol de alumno.

Acciones habituales:

- Consultar listado de alumnos.
- Ver datos básicos.
- Activar o revocar rol de delegado.
- Comprobar saldos o información operativa.

## 13. Delegados

El rol de delegado permite representar ciertas funciones especiales dentro del entorno escolar.

Desde administración se puede:

- Asignar delegado.
- Revocar delegado.
- Consultar alumnos con ese rol.

La gestión debe hacerse con cuidado, ya que afecta a permisos o vistas específicas.

## 14. Gestión familiar

La sección de familias permite revisar relaciones entre familiares y alumnos.

Usos principales:

- Ver qué familiar está vinculado a cada alumno.
- Detectar vínculos incorrectos.
- Comprobar relaciones activas.
- Ayudar en incidencias de acceso familiar.

La vinculación se realiza mediante códigos temporales desde la app.

## 15. Horarios de corte

Los horarios de corte definen hasta qué hora se pueden realizar pedidos para cada turno.

Turnos habituales:

| Turno | Hora por defecto |
| --- | --- |
| Mañana | 09:00 |
| Tarde | 15:00 |
| Noche | 18:00 |

Administración puede ajustar estos horarios según la organización del centro.

## 16. Bypass de cortes para pruebas

Durante demostraciones o desarrollo puede activarse un bypass para saltar los límites horarios.

Uso recomendado:

- Activarlo solo en pruebas.
- Desactivarlo para uso real.
- Documentar cuándo se usa.

En producción real, los cortes horarios deben estar activos para evitar pedidos fuera de plazo.

## 17. Tickets de cocina

Al crear un pedido, el sistema intenta generar o enviar un ticket operativo.

El ticket incluye:

- Número de recogida.
- Fecha y hora.
- Alumno.
- Turno.
- Productos.
- Extras.
- Ingredientes retirados.
- Notas.
- Total.

La impresión es best-effort: si la impresora falla, el pedido no se bloquea.

## 18. Prueba de impresión

Desde ajustes de administración se puede:

- Ver un ticket de prueba en PDF.
- Enviar un ticket de prueba a la impresora configurada.

La impresora prevista es AVP-TC300 en red local. La validación física final queda como mejora pendiente para producción.

## 19. Buenas prácticas de administración

- Revisar productos activos antes del inicio del servicio.
- Desactivar productos agotados.
- Mantener alérgenos actualizados.
- Revisar pedidos pendientes antes de cada recreo.
- Usar el KDS durante la preparación.
- Marcar pedidos como entregados cuando se recojan.
- No dejar activo el bypass horario en uso real.
- Probar impresión antes de una jornada real.

## 20. Incidencias habituales

### Un producto no aparece al alumnado

Posible causa: el producto está desactivado.

Solución: revisar su estado en **Productos** y activarlo si corresponde.

### Un pedido no se puede cancelar

Posible causa: se ha superado la ventana de cancelación o el estado ya no permite cancelarlo.

Solución: revisar el estado y las reglas de horario.

### La APK no conecta con la API

Posible causa: `VITE_API_BASE_URL` apunta a `localhost` o a una URL no accesible desde el móvil.

Solución: compilar la APK con una URL remota accesible, como Railway.

### Stripe no carga

Posible causa: falta la clave pública `VITE_STRIPE_PUBLISHABLE_KEY` o la configuración de pagos.

Solución: revisar variables de entorno de frontend y backend.

### La impresora no imprime

Posible causa: impresora apagada, IP incorrecta o red no accesible.

Solución: comprobar red local, IP configurada y prueba PDF.

## 21. Limitaciones del MVP

- Autenticación demo pendiente de sustituir por Supabase Auth o JWT.
- Stripe en modo test.
- Impresión pendiente de validación física final.
- Sin suite E2E completa.
- Sin control de stock avanzado.
- Sin APK release firmada.

Estas limitaciones no impiden presentar el proyecto como MVP funcional, pero deben indicarse como líneas de mejora antes de producción.

