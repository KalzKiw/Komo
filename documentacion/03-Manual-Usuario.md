# Manual de Usuario

## Acceso a la Aplicación

La aplicación se usa desde un navegador web. En desarrollo se puede abrir desde `http://localhost:5173` al levantar el frontend con Vite. En producción se accede desde la URL publicada en Vercel.

En la pantalla inicial existen accesos rápidos de demostración para:

- Alumno: `student1@cafes.app`
- Padre/madre: `parent1@cafes.app`
- Administrador: `admin1@cafes.app`

## Registro e Inicio de Sesión

1. Entrar en la pantalla de login.
2. Introducir correo y contraseña.
3. Pulsar **Entrar**.
4. Si se desea una cuenta nueva, usar la pestaña **Registro**.
5. En el registro se puede seleccionar rol de alumno o familiar y declarar alérgenos.

## Uso como Alumno

### Catálogo

1. Acceder a **Inicio**.
2. Filtrar productos por categoría.
3. Abrir un producto para ver detalle, alérgenos, información sanitaria y opciones.
4. Elegir cantidad y personalizaciones.
5. Añadir al carrito.

### Carrito y Pedido

1. Abrir el carrito desde el botón central inferior.
2. Revisar productos, cantidades y total.
3. Confirmar el pedido.
4. Si hay conflicto con alérgenos declarados, la app muestra un aviso antes de continuar.

### Pedidos

En **Pedidos** se pueden consultar:

- Pedidos pendientes.
- Pedidos completados.
- Detalle de productos.
- Número de recogida.
- Estado del pedido.

### Monedero

En **Monedero** se muestra:

- Saldo disponible.
- Últimos movimientos.
- Pedidos como cargos o devoluciones.
- Gestión visual de método de pago demo.

### Perfil

En **Perfil** se consultan datos del usuario, saldo, pedidos, alérgenos y opciones de cuenta.

## Uso como Familiar

La cuenta familiar permite:

- Generar códigos de vinculación.
- Vincularse con alumnos.
- Consultar hijos vinculados.
- Recargar saldo del monedero del alumno.
- Revisar movimientos y pedidos recientes.
- En la cuenta de alumno, recargar su propio monedero desde la pestaña Monedero.
- Guardar teléfono y método de pago desde Perfil. La app muestra solo los últimos cuatro dígitos de la tarjeta.
- Desde Administración se pueden ajustar los cortes de reservas y desactivarlos temporalmente para pruebas.

## Uso como Administrador

El panel de administración permite:

- Consultar previsión de producción.
- Ver cola KDS.
- Gestionar productos.
- Consultar y actualizar pedidos.
- Activar o revocar rol de delegado.
- Consultar vínculos familiares.
- Configurar horarios de corte.

## Preguntas Frecuentes

**¿La app funciona sin backend?**  
No. El frontend necesita la API para login, productos, pedidos y perfil.

**¿Puedo crear pedidos con alérgenos?**  
Sí, pero la aplicación muestra una advertencia si detecta un alérgeno declarado por el usuario.

**¿Puedo usarla como PWA offline?**  
Actualmente se prioriza el uso online. El service worker se ha desactivado para evitar cachés obsoletas durante el despliegue.
