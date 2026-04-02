# Memoria del Proyecto - CafeteriaSolo

Este documento sirve como bitacora diaria de trabajo hasta el cierre del proyecto.

## Objetivo general
Entregar una plataforma funcional de cafeteria escolar con:
- API estable y documentada.
- Frontend movil usable para alumnado/familias.
- Flujo operativo para administracion y KDS.

## Como usar esta memoria
- Cada dia agregar una entrada nueva al final.
- Registrar trabajo real realizado, bloqueos y proximo paso.
- Mantener formato corto y accionable.

Plantilla diaria:

```text
## YYYY-MM-DD
### Lo hecho
- ...

### Decisiones tomadas
- ...

### Bloqueos o riesgos
- ...

### Proximo paso
- ...
```

---

## 2026-03-25
### Lo hecho
- Rediseno de la app movil del consumidor (header fijo, contenido interno scrolleable y navegacion inferior).
- Mejora de pantalla de Pedidos con filtros, acciones y vista de detalle in-page.
- Integracion de ficha sanitaria tipada en frontend/productInfo.ts.
- Rediseno de detalle de producto con prioridad de alergenos y nutricion progresiva.
- Simplificacion de Perfil:
  - eliminacion del acceso directo a historial desde ese bloque,
  - boton de cerrar sesion redisenado,
  - eliminacion de direccion no relevante,
  - eliminacion del titulo redundante de datos del alumno.
- Revision de Swagger para alinear autenticacion documentada con autenticacion real por cabeceras en entorno actual.

### Decisiones tomadas
- Mantener frontend principal en HTML/CSS/JS para iterar rapido sobre UX.
- Priorizar claridad de informacion sanitaria sobre densidad visual.
- Documentar seguridad API segun implementacion real actual (x-user-role) en lugar de JWT ficticio.

### Bloqueos o riesgos
- Parte del dataset sanitario existe en TypeScript separado y puede divergir del consumo runtime si no se unifica.
- Aun no hay suite de tests automatizados end-to-end para cubrir los flujos criticos.

### Proximo paso
- Unificar origen de datos sanitarios para evitar duplicidad.
- Añadir ejemplos detallados en Swagger (requests/responses de exito y error).
- Definir checklist de cierre (QA funcional, seguridad basica, despliegue).

## Registro futuro
Anadir aqui las proximas fechas usando la plantilla.
