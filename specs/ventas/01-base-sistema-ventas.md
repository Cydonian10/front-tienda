# SPEC 01 — Base del sistema Ventas y navegación de Cajas y turnos

> **Status:** Aprobado
> **Depends on:** Ninguna
> **Date:** 2026-10-27
> **Objective:** Habilitar el sistema Ventas en la API y Angular con acceso protegido a una página informativa de Cajas y turnos, sin operaciones comerciales todavía.

## Why this spec exists

`api-tienda` ya contiene entidades de cajas, turnos y ventas, pero no tiene un módulo de Ventas registrado ni controladores operativos. El portal Angular muestra Ventas como sistema no disponible y usa `SALES` para su icono, mientras que el código estable de la API es `VENTAS`. Esta spec habilita el acceso sin fingir que esas entidades ya tienen funcionalidad disponible.

## Scope

**In:**

- Registrar la presentación del sistema `VENTAS` y el permiso `CAJAS_TURNOS_LEER` en los catálogos existentes de `api-tienda`, para incorporarlos mediante `npm run migration:permissions` sin asignar el permiso automáticamente a ningún rol.
- Crear `api-tienda/src/features/sales/sales.module.ts` y registrarlo en `api-tienda/src/app.module.ts` como límite de la funcionalidad futura, sin rutas HTTP ni lógica de caja en esta etapa.
- Incorporar Ventas a «Mis sistemas» y a su navegación en Angular mediante el código `VENTAS`.
- Redirigir `/admin/ventas` a `/admin/ventas/cajas-turnos` y mostrar una única página «Cajas y turnos» que indique que su gestión estará disponible más adelante; no mostrar datos, cifras o controles operativos ficticios.
- Proteger la página y su entrada en el menú con `CAJAS_TURNOS_LEER` asociado al sistema `VENTAS`; conservar `/admin` como selector de sistemas.
- Cubrir la navegación y los permisos con pruebas en ambos proyectos.

**Out of scope (for future specs):**

- Alta, edición o desactivación de cajas; apertura, cierre o consulta operativa de turnos; movimientos de efectivo.
- Registro de ventas, pagos, tickets, devoluciones, descuentos o interacción con existencias.
- Endpoints de demostración u operativos en la API; datos simulados en Angular.
- Asignaciones automáticas a roles y cambios en los módulos existentes de Inventario o Control de acceso más allá del catálogo compartido de permisos/sistemas.

## Data model

- No se crean tablas, migraciones ni entidades nuevas; se conservan las entidades de `api-tienda/src/features/sales/entities/` sin activarlas para operaciones.
- `api-tienda/src/shared/authorization/system-codes.ts`: reutilizar `SYSTEM_CODES.VENTAS = 'VENTAS'`.
- `api-tienda/src/shared/authorization/system-definitions.ts`: añadir nombre y descripción visibles para `VENTAS`.
- `api-tienda/src/shared/authorization/permission-codes.ts` y `api-tienda/src/shared/authorization/permission-definitions/ventas.ts`: definir `CAJAS_TURNOS_READ: 'CAJAS_TURNOS_LEER'` como permiso del recurso `CAJAS_TURNOS`, acción `LEER`, del sistema `VENTAS`; agregar la definición a `api-tienda/src/shared/authorization/permission-definitions.ts`.
- El seed existente `api-tienda/scripts/seed-permissions.mjs` persiste el registro de sistema y permiso sin crear relaciones con roles; no necesita una ruta nueva ni una migración.
- `src/app/api/interfaces/access-control/permision.interface.ts`: reflejar `CAJAS_TURNOS_READ: 'CAJAS_TURNOS_LEER'` en `PERMISSION_CODES`.
- El menú en `src/app/system-portal/services/control-access/system-menu.service.ts` utiliza el código `VENTAS`; `SALES` deja de ser el identificador empleado para ese sistema. No hay respuestas remotas nuevas para la pantalla informativa.

## Implementation plan

1. Añadir la definición visible de `VENTAS` y el permiso de lectura en los catálogos de `api-tienda`; probar la asociación código–sistema y que el seed existente no asigna roles. Mantener la API ejecutable sin nuevas rutas.
2. Crear y registrar `SalesModule` en `api-tienda`, sin controladores ni manejadores; comprobar `npm run build` y la conservación de rutas existentes.
3. Incorporar el código del permiso en Angular y configurar el menú de `VENTAS` con el enlace «Cajas y turnos» y el icono existente; probar que «Mis sistemas» solo ofrece «Ingresar» cuando se tiene acceso.
4. Añadir `src/app/ventas/ventas.routes.ts` y la carga diferida desde `src/app/app.routes.ts`; proteger `/admin/ventas/cajas-turnos` con `permissionGuard('VENTAS', PERMISSION_CODES.CAJAS_TURNOS_READ)` y redirigir `/admin/ventas` a esa página. Mantener la aplicación navegable tras este paso.
5. Crear la página y su plantilla en `src/app/ventas/pages/cajas-turnos/`, reutilizando el layout y los estilos del proyecto para mostrar únicamente el aviso informativo; añadir pruebas de contenido, redirección y accesos permitido/denegado.
6. Comprobar el seed con `npm run migration:permissions` en un entorno de prueba con base de datos disponible, verificar asignación manual del permiso en Control de acceso y ejecutar `npm test` y `npm run build` en la API y `npm test -- --watch=false` y `npm run build` en Angular.

## Acceptance criteria

- [ ] El seed registra o actualiza el sistema `VENTAS` y el permiso `CAJAS_TURNOS_LEER` en su sistema; ejecutarlo dos veces no duplica registros ni concede el permiso a roles.
- [ ] `SalesModule` está registrado y `api-tienda` compila; no hay rutas HTTP de cajas, turnos o ventas añadidas por esta spec.
- [ ] Con `CAJAS_TURNOS_LEER` asignado en `VENTAS`, «Mis sistemas» permite ingresar y el menú muestra «Cajas y turnos».
- [ ] Un permiso de igual código en otro sistema o carecer del permiso en `VENTAS` no da acceso: «Mis sistemas» no ofrece ingreso, el menú no muestra la entrada y la URL protegida redirige a `/admin`.
- [ ] `/admin/ventas` redirige a `/admin/ventas/cajas-turnos`; la página muestra el aviso de futura disponibilidad y no simula saldos, turnos ni botones de operación.
- [ ] Al recargar `/admin/ventas/cajas-turnos` se conserva la navegación protegida con los permisos correspondientes; `/admin` y los demás sistemas continúan funcionando.
- [ ] Pasan las pruebas y compilaciones indicadas de ambos repositorios.

## Decisions

- **Sí:** numeración propia desde `01` dentro de `specs/ventas/`, separada de la secuencia existente en la raíz de `specs/`.
- **Sí:** usar `VENTAS` en Angular y API; `SALES` no coincide con el código de sistema existente en el backend.
- **Sí:** primera entrega informativa con un solo enlace «Cajas y turnos»; permite establecer la navegación sin aparentar gestión de caja.
- **Sí:** permiso específico `CAJAS_TURNOS_LEER`, asignado manualmente; un permiso general de ventas daría más alcance del necesario.
- **Sí:** reutilizar las entidades existentes sin exponer endpoints; sus reglas operativas se definirán en otras specs.
- **No:** datos de demostración o rutas HTTP de ejemplo; generarían una expectativa de funcionalidad que todavía no existe.

## Risks

| Risk                                                                               | Mitigation                                                                                                      |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| El sistema figura como disponible antes de asignar permisos a los usuarios.        | Mantener la tarjeta sin enlace y la ruta denegada mientras no exista asignación explícita.                      |
| Confundir las entidades existentes de Ventas con funcionalidades listas para usar. | Registrar un módulo sin controladores y mostrar una página explícitamente informativa.                          |
| El seed requiere una base de datos accesible para verificar la persistencia real.  | Probar el catálogo sin base de datos y ejecutar el seed en un entorno de prueba cuando la base esté disponible. |

## What is **not** in this spec

- No se administran cajas ni se abren o cierran turnos.
- No se registran ventas ni se exponen endpoints de caja, turnos o ventas.
- No se conceden permisos automáticamente ni se usan datos ficticios.
