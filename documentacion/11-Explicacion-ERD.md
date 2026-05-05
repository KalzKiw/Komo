# Explicación del Esquema de Base de Datos

Este documento sirve como apoyo para explicar el diagrama entidad-relación (`db/erd.mmd`) durante la presentación del proyecto.

## 1. Idea general del modelo

El esquema representa una aplicación de pedidos anticipados para una cafetería escolar. Está organizado alrededor de cuatro bloques principales:

- Usuarios, roles y cursos.
- Productos y alérgenos.
- Pedidos y líneas de pedido.
- Familias, monedero y configuración.

La tabla central es `USERS`, porque casi todas las operaciones del sistema dependen de un usuario: alumno, familiar, administrador, staff o delegado.

## 2. Usuarios y cursos

`COURSES` almacena los cursos escolares del centro.

Ejemplos:

- 1º DAM.
- 2º DAM.
- 4º ESO.

`USERS` almacena todos los usuarios del sistema. No se separan en tablas distintas para alumnos, familiares o administradores. En su lugar se utiliza el campo `role`.

Roles principales:

```text
ADMIN
STAFF
STUDENT
DELEGATE
PARENT
```

Esto permite tener una única tabla de usuarios y controlar el comportamiento mediante permisos.

Campos importantes de `USERS`:

- `email`: correo único del usuario.
- `full_name`: nombre completo.
- `role`: tipo de usuario.
- `course_id`: curso asociado, sobre todo para alumnado.
- `is_beneficiary`: indica si el alumno tiene condición de beneficiario.
- `wallet_balance`: saldo actual del monedero.
- `phone`: teléfono de contacto.
- `payment_card_last4`: últimos cuatro dígitos visibles de tarjeta.
- `stripe_customer_id`: identificador de cliente en Stripe.
- `stripe_payment_method_id`: método de pago guardado en Stripe.

No se guarda la tarjeta completa en la base de datos. Los datos sensibles los gestiona Stripe.

## 3. Familias y vinculación

La parte familiar se modela con `FAMILY_LINKS` y `LINKING_TOKENS`.

`FAMILY_LINKS` representa la relación entre un familiar y un alumno.

Tiene dos referencias a `USERS`:

```text
parent_user_id  -> USERS.id
student_user_id -> USERS.id
```

Esto significa que tanto el familiar como el alumno son usuarios, pero con roles distintos.

El campo `status` permite saber si el vínculo está activo o revocado.

Ejemplo:

```text
parent_user_id  = usuario padre/madre
student_user_id = usuario alumno
relation        = PARENT
status          = ACTIVE
```

`LINKING_TOKENS` almacena códigos temporales de vinculación familiar.

Flujo general:

1. Se genera un código temporal.
2. El alumno o familiar lo canjea.
3. Se crea un vínculo en `FAMILY_LINKS`.
4. El token queda usado o caduca.

Esto evita que las familias se vinculen de forma manual sin control.

## 4. Productos y alérgenos

`PRODUCTS` almacena los productos de la cafetería.

Campos importantes:

- `name`: nombre del producto.
- `description`: descripción.
- `image_url`: imagen asociada si existe.
- `product_info`: ficha técnica en formato JSON.
- `price`: precio.
- `is_active`: indica si el producto aparece en el catálogo de compra.

El campo `is_active` es importante porque permite ocultar productos sin borrarlos. Si un producto deja de estar disponible, se desactiva y deja de aparecer al alumnado, pero sigue existiendo para conservar históricos.

`ALLERGENS` almacena el catálogo de alérgenos.

La relación entre productos y alérgenos es de muchos a muchos. Por eso existe la tabla intermedia `PRODUCT_ALLERGENS`.

Ejemplo:

- Un croissant puede tener gluten, leche y huevo.
- El alérgeno gluten puede estar en croissants, bocadillos y sándwiches.

La relación queda así:

```text
PRODUCTS -> PRODUCT_ALLERGENS -> ALLERGENS
```

## 5. Alérgenos del usuario

`USER_ALLERGIES` relaciona usuarios con alérgenos declarados.

También es una relación muchos a muchos:

- Un usuario puede tener varios alérgenos.
- Un alérgeno puede estar asociado a muchos usuarios.

La aplicación compara:

```text
alérgenos declarados por el usuario
contra
alérgenos asociados al producto
```

Si hay coincidencia, la app muestra una advertencia antes de confirmar el pedido.

Ejemplo:

1. El alumno declara alergia a leche.
2. El producto "Café con leche" contiene leche.
3. Al añadirlo al carrito, la app puede avisar del conflicto.

## 6. Pedidos

`ORDERS` representa el pedido principal.

Tiene dos referencias a `USERS`:

```text
user_id
placed_by_user_id
```

`user_id` es el usuario beneficiario del pedido, normalmente el alumno que lo recoge.

`placed_by_user_id` es el usuario que realiza el pedido. Puede ser el propio alumno o un familiar.

Ejemplo:

```text
Un padre hace un pedido para su hijo.
```

En ese caso:

```text
user_id            = hijo/alumno
placed_by_user_id  = padre/madre
```

Esto permite saber para quién era el pedido y quién lo realizó.

Campos importantes de `ORDERS`:

- `shift`: turno del pedido.
- `scheduled_for`: fecha programada.
- `status`: estado del pedido.
- `subtotal`: suma de líneas antes de ajustes.
- `total`: importe total.
- `cancellation_deadline`: fecha límite de cancelación.
- `cancelled_at`: fecha de cancelación si existe.
- `credited_to_wallet`: indica si se devolvió saldo al monedero.

Estados del pedido:

```text
PENDING
IN_PREPARATION
READY
DELIVERED
CANCELLED
```

Flujo habitual:

1. `PENDING`: pedido recibido.
2. `IN_PREPARATION`: cocina lo prepara.
3. `READY`: pedido listo para recoger.
4. `DELIVERED`: pedido entregado.
5. `CANCELLED`: pedido cancelado.

## 7. Líneas de pedido

`ORDER_ITEMS` almacena los productos concretos incluidos en cada pedido.

Un pedido puede tener muchas líneas.

Ejemplo:

```text
Pedido 1
- Café con leche x1
- Croissant x1
- Agua x1
```

Cada línea guarda:

- `order_id`: pedido al que pertenece.
- `product_id`: producto vendido.
- `quantity`: cantidad.
- `unit_price`: precio unitario en el momento del pedido.
- `line_total`: total de la línea.
- `customization_json`: personalizaciones.
- `kitchen_note`: nota para cocina.

Es importante que `ORDER_ITEMS` guarde el precio unitario. Si mañana cambia el precio de un producto, el pedido antiguo debe conservar el precio que se cobró en su momento.

## 8. Monedero

`WALLET_TRANSACTIONS` almacena los movimientos del monedero.

Está relacionada con `USERS`.

`USERS.wallet_balance` guarda el saldo actual.

`WALLET_TRANSACTIONS` guarda el histórico de movimientos.

Puede explicarse así:

```text
wallet_balance = saldo actual
wallet_transactions = libro de movimientos
```

Ejemplos de movimientos:

- Recarga del monedero.
- Devolución por cancelación.
- Ajuste manual.
- Movimiento asociado a una operación familiar.

## 9. Configuración global

`SETTINGS` es una tabla de configuración global de tipo clave/valor.

No tiene relaciones con otras tablas porque sus valores afectan al sistema completo.

Ejemplos:

| key | value |
| --- | --- |
| `ORDER_CUTOFF_MORNING` | `09:00` |
| `ORDER_CUTOFF_AFTERNOON` | `15:00` |
| `ORDER_CUTOFF_NIGHT` | `18:00` |
| `ORDER_GRACE_MINUTES` | `0` |
| `ORDER_CUTOFF_DISABLED` | `false` |

Sirve para cambiar configuración sin modificar código.

Por ejemplo:

- Hora límite para pedidos de mañana.
- Hora límite para pedidos de tarde.
- Minutos de gracia.
- Desactivación temporal de cortes horarios para pruebas.

Es normal que `SETTINGS` aparezca sola en el ERD.

## 10. Cómo se crea un pedido

El flujo completo de creación de pedido puede explicarse así:

1. El usuario inicia sesión.
2. La app carga su perfil desde `USERS`.
3. Si es alumno, se consultan sus alérgenos en `USER_ALLERGIES`.
4. Se carga el catálogo desde `PRODUCTS`.
5. Los alérgenos de cada producto se obtienen mediante `PRODUCT_ALLERGENS`.
6. El alumno añade productos al carrito.
7. Al confirmar, se crea un registro en `ORDERS`.
8. Por cada producto del carrito, se crea una línea en `ORDER_ITEMS`.
9. Si se usa monedero, se actualiza `wallet_balance`.
10. Si hay movimiento económico, se registra en `WALLET_TRANSACTIONS`.
11. Administración ve el pedido en el panel.
12. Cocina lo gestiona desde el KDS.

## 11. Cómo funciona el control de alérgenos

El control de alérgenos cruza dos informaciones:

- Alérgenos declarados por el usuario: `USER_ALLERGIES`.
- Alérgenos asociados al producto: `PRODUCT_ALLERGENS`.

Si existe coincidencia, el sistema muestra una advertencia.

Ejemplo:

```text
Usuario -> alergia a leche
Producto -> contiene leche
Resultado -> aviso antes de confirmar
```

Esto no bloquea necesariamente el pedido, pero informa al usuario antes de continuar.

## 12. Cómo funciona la parte familiar

La parte familiar aprovecha la tabla `USERS`.

Un familiar es un usuario con rol `PARENT`.

Un alumno es un usuario con rol `STUDENT`.

La relación se guarda en `FAMILY_LINKS`.

Si un familiar realiza un pedido para un alumno:

```text
ORDERS.user_id           = alumno
ORDERS.placed_by_user_id = familiar
```

Así el sistema sabe quién recoge el pedido y quién lo creó.

## 13. Cómo funciona Stripe

En este MVP no se guarda una tabla propia de métodos de pago.

Los datos de Stripe se almacenan como referencias en `USERS`:

- `stripe_customer_id`.
- `stripe_payment_method_id`.
- `payment_card_last4`.

La tarjeta completa no se guarda nunca en la base de datos. Stripe se encarga de almacenar los datos sensibles.

Esto permite mostrar al usuario una tarjeta resumida sin comprometer información bancaria.

## 14. Decisiones de diseño importantes

### Una sola tabla de usuarios

Se usa una sola tabla `USERS` con campo `role`.

Ventaja:

- Evita duplicar datos comunes.
- Permite gestionar permisos desde un único modelo.
- Facilita relaciones familiares y pedidos.

### Productos desactivados en lugar de borrados

Los productos tienen `is_active`.

Ventaja:

- Se pueden ocultar productos no disponibles.
- No se pierde histórico de pedidos.
- Administración puede reactivarlos.

### Precios guardados en líneas de pedido

`ORDER_ITEMS` guarda `unit_price` y `line_total`.

Ventaja:

- Los pedidos antiguos mantienen el precio real cobrado.
- Cambiar el precio de un producto no altera históricos.

### Tablas intermedias para muchos a muchos

Se usan tablas intermedias:

- `PRODUCT_ALLERGENS`.
- `USER_ALLERGIES`.

Ventaja:

- Un producto puede tener varios alérgenos.
- Un alérgeno puede pertenecer a muchos productos.
- Un usuario puede declarar varios alérgenos.
- Un alérgeno puede afectar a muchos usuarios.

## 15. Preguntas frecuentes de defensa

### ¿Por qué `SETTINGS` está sola?

Porque es una tabla de configuración global. No representa una entidad como usuario o producto. Sus valores afectan al sistema completo, por eso no necesita claves foráneas.

### ¿Por qué Stripe está en `USERS`?

Porque en este MVP solo se guardan referencias seguras de Stripe. Los datos sensibles de tarjeta no se almacenan en nuestra base de datos.

### ¿Por qué no se borran productos?

Porque se usa `is_active`. Así se puede ocultar un producto sin romper pedidos antiguos.

### ¿Por qué `ORDER_ITEMS` guarda precio?

Para conservar histórico. Si cambia el precio del producto, el pedido antiguo sigue mostrando el precio original.

### ¿Cómo se garantiza la integridad?

Mediante claves primarias, claves foráneas, tablas intermedias y restricciones. Por ejemplo:

- Un pedido debe estar asociado a un usuario.
- Una línea de pedido debe pertenecer a un pedido.
- Un producto de una línea debe existir.
- Los precios no pueden ser negativos.
- Las cantidades deben ser mayores que cero.
- Los estados se controlan mediante enumeraciones.

## 16. Resumen para explicar en una frase

El modelo separa usuarios, productos, alérgenos, pedidos y movimientos económicos. Usa relaciones muchos a muchos para alérgenos, distingue entre quien realiza un pedido y quien lo recibe, conserva históricos de precio en las líneas de pedido y centraliza la configuración global en una tabla clave/valor.

