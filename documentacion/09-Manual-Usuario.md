# Manual de Usuario - KOMO

Este manual explica cómo usar KOMO desde el punto de vista del alumnado y de las familias. La aplicación puede utilizarse desde navegador, como PWA instalada o mediante la APK Android de pruebas.

## 1. Acceso a la aplicación

En desarrollo, la aplicación se abre en:

```text
http://localhost:5173
```

En producción, se accede desde la URL publicada en Vercel o desde la APK instalada en Android.

Usuarios demo habituales:

| Perfil | Correo |
| --- | --- |
| Alumno | `student1@cafes.app` |
| Familiar | `parent1@cafes.app` |
| Administrador | `admin1@cafes.app` |

## 2. Inicio de sesión

1. Abrir la aplicación.
2. Introducir el correo y contraseña de usuario.
3. Pulsar **Entrar**.
4. Si se usa el entorno demo, seleccionar uno de los accesos rápidos disponibles.

Si el usuario no tiene cuenta, puede usar la opción de registro.

## 3. Registro de una cuenta

El registro está pensado como un flujo guiado:

1. Introducir correo y contraseña.
2. Seleccionar tipo de cuenta: alumno o familiar.
3. Completar el nombre.
4. Indicar alérgenos si corresponde.
5. Confirmar el registro.

Los alérgenos pueden modificarse más adelante desde el perfil.

## 4. Pantalla de inicio y catálogo

La pantalla **Inicio** muestra el catálogo de productos disponibles. Solo aparecen productos activos; si administración desactiva un producto, deja de mostrarse en esta pantalla.

Acciones disponibles:

- Ver productos por categoría.
- Abrir la ficha de un producto.
- Consultar precio, alérgenos e información alimentaria.
- Elegir cantidad.
- Aplicar personalizaciones si están disponibles.
- Añadir el producto al carrito.

## 5. Ficha de producto

Al abrir un producto se muestra su información principal:

- Nombre.
- Precio.
- Categoría.
- Alérgenos.
- Ingredientes o datos alimentarios.
- Información técnica estimada si no existe ficha completa en base de datos.
- Opciones de personalización cuando corresponda.

Si el producto contiene un alérgeno declarado por el usuario, la aplicación lo tendrá en cuenta antes de confirmar el pedido.

## 6. Carrito

El carrito recoge los productos seleccionados antes de crear el pedido.

Desde el carrito se puede:

- Revisar productos añadidos.
- Cambiar cantidades.
- Ver el total.
- Confirmar el pedido.
- Cerrar el carrito y volver al catálogo.

Si el usuario tiene alérgenos declarados y el pedido contiene un producto conflictivo, la aplicación muestra una advertencia antes de continuar.

## 7. Confirmación de pedido

Para confirmar un pedido:

1. Revisar los productos del carrito.
2. Comprobar el total.
3. Revisar posibles avisos de alérgenos.
4. Confirmar el pedido.

Una vez creado, el pedido pasa a estar disponible en la pantalla **Pedidos**.

## 8. Estados del pedido

Los pedidos pueden tener estos estados:

| Estado | Significado |
| --- | --- |
| `PENDING` | Pedido creado y pendiente de preparación. |
| `IN_PREPARATION` | Pedido en preparación. |
| `READY` | Pedido listo para recoger. |
| `DELIVERED` | Pedido entregado. |
| `CANCELLED` | Pedido cancelado. |

## 9. Pantalla de pedidos

En **Pedidos** se pueden consultar:

- Pedidos recientes.
- Pedidos en curso.
- Pedidos finalizados.
- Detalle de productos.
- Número o referencia de recogida.
- Estado actual.

Si las reglas horarias lo permiten, un pedido puede cancelarse desde esta pantalla.

## 10. Monedero

La pantalla **Monedero** muestra el saldo disponible y los movimientos.

El alumno puede consultar:

- Saldo actual.
- Últimos movimientos.
- Cargos por pedidos.
- Recargas o devoluciones.

En el caso de familias, el monedero permite ver el saldo de los hijos vinculados y realizar recargas.

## 11. Perfil de usuario

En **Perfil** se puede consultar o actualizar:

- Datos básicos del usuario.
- Teléfono.
- Alérgenos declarados.
- Método de pago resumido, si existe.
- Opciones de cuenta.

Por seguridad, la aplicación no muestra datos completos de tarjeta, solo información resumida.

## 12. Uso como familiar

La cuenta familiar permite gestionar alumnos vinculados.

Funciones principales:

- Consultar hijos vinculados.
- Ver saldo de cada alumno.
- Consultar pedidos recientes.
- Recargar monedero.
- Usar Stripe en modo test para pagos.
- Acceder al perfil del hijo.

## 13. Vinculación familiar

El sistema de vinculación se realiza mediante códigos temporales.

Flujo general:

1. El familiar genera o solicita un código de vinculación.
2. El alumno canjea el código desde su cuenta.
3. La relación queda registrada.
4. El familiar puede consultar datos y saldo del alumno vinculado.

Los códigos están pensados para ser temporales y evitar vinculaciones no controladas.

## 14. Navegación en móvil

La aplicación está adaptada para móvil:

- El botón atrás cierra primero detalles, carrito o modales.
- Si el usuario está en una pestaña secundaria, atrás vuelve a la pestaña anterior.
- Deslizar horizontalmente cambia entre Inicio, Monedero, Pedidos y Perfil.
- Las transiciones usan animación de deslizamiento.
- Los gestos se bloquean en formularios y diálogos para evitar acciones accidentales.

## 15. Uso como PWA

La aplicación puede instalarse desde navegadores compatibles.

Ventajas:

- Acceso desde icono en el dispositivo.
- Experiencia parecida a una app.
- Carga de recursos estáticos mediante service worker.

Limitación importante: login, pedidos, pagos y perfil necesitan conexión a la API.

## 16. Uso desde APK Android

La APK Android se instala como aplicación de pruebas con el nombre **KOMOAPK**.

Para funcionar correctamente, la APK debe estar compilada con `VITE_API_BASE_URL` apuntando a una API remota. Si apunta a `localhost`, solo funcionará en el equipo de desarrollo y no en el móvil.

## 17. Preguntas frecuentes

**¿Puedo hacer pedidos sin conexión?**
No. La aplicación necesita conexión para crear pedidos, consultar perfil, pagar y cargar datos actualizados.

**¿Por qué no veo un producto?**
Porque puede estar desactivado desde administración. Los productos desactivados no aparecen en el catálogo de compra.

**¿Puedo pedir un producto con alérgenos?**
Sí, pero la aplicación muestra una advertencia si detecta conflicto con tus alérgenos declarados.

**¿El pago Stripe es real?**
En el MVP se usa integración en modo test. Para producción harían falta credenciales y webhooks definitivos.

**¿La APK funciona con el PC apagado?**
Sí, si apunta a una API remota disponible, por ejemplo Railway.

