# SPEC 07 — Cajas y aperturas de caja

> **Status:** Draft
> **Depends on:** API `ApiTienda` SPEC 11 (personas y roles), API `ApiTienda` SPEC 12 (autenticación y guards), API `ApiTienda` SPEC 16 (cajas, aperturas y cierres).
> **Date:** 2026-09-08
> **Objective:** Gestionar cajas y abrirlas desde `Operaciones > Cajas`, asignando responsable según el rol y consultando su historial mensual de aperturas.

## Scope

**In:**

- Cambios en `ApiTienda` para extender `CashRegister` con un `code` manual, único y obligatorio, además de `name` y `active`.
- Migración nueva en `ApiTienda` para agregar el código único de caja y el responsable de una apertura, sin modificar migraciones históricas.
- CRUD administrativo de cajas en `/cash-registers`:
  - `GET /cash-registers` devuelve las cajas visibles para el usuario autenticado, incluidos código, nombre, estado y una apertura abierta resumida cuando exista.
  - `POST /cash-registers` crea una caja con `code`, `name` y estado inicial activo.
  - `PATCH /cash-registers/:id` actualiza código, nombre y estado activo.
  - Solo `ADMINISTRADOR` puede crear o editar una caja.
  - Un `TRABAJADOR` solo recibe cajas activas.
- Extensión de `CashRegisterOpening` con la relación obligatoria `responsible`:
  - `openedBy` conserva a la persona autenticada que ejecutó la apertura.
  - `responsible` identifica a la persona a cargo de la caja.
  - Cuando un `TRABAJADOR` abre una caja, el API asigna como responsable a su propia persona e ignora cualquier `responsibleId` recibido.
  - Cuando un `ADMINISTRADOR` abre una caja, puede indicar un `responsibleId` de una persona operativa.
- Validación de responsable operativo: persona no eliminada, con cuenta de acceso y con al menos uno de los roles `ADMINISTRADOR` o `TRABAJADOR`.
- Endpoint administrativo para obtener las personas elegibles como responsables de caja.
- Consulta de aperturas por caja y mes calendario local mediante `GET /cash-register-openings`, con filtros obligatorios de `cashRegisterId`, `year` y `month`.
- Respuestas de aperturas con fecha y hora de apertura, responsable, monto inicial y estado, además de las identidades de auditoría necesarias.
- Nueva ruta frontend `/operaciones/cajas` y la entrada **Cajas** bajo el grupo **Operaciones** del menú lateral.
- Modelos y servicios Angular para cajas, aperturas y responsables elegibles.
- Pantalla Angular de cajas con:
  - Listado de cajas visibles para el usuario.
  - Creación y edición de código, nombre y estado para administradores mediante un diálogo reutilizable.
  - Acciones administrativas ocultas para trabajadores.
  - Acción **Abrir caja** para cajas activas sin apertura abierta.
  - Diálogo de apertura con monto inicial mayor o igual a cero.
  - Selector de responsable únicamente para administradores, inicializado con su propia persona.
  - Responsable de solo lectura para trabajadores, asignado a su propia persona.
  - Bloqueo de apertura y resumen visible de la sesión cuando la caja ya está abierta.
  - Selección de una caja para consultar debajo su historial mensual.
  - Navegación al mes anterior o siguiente, iniciando en el mes calendario local actual.
  - Historial con fecha y hora de apertura, responsable, monto inicial y estado `open` o `closed`.
  - Estados de carga, vacío, error, envío exitoso y conflicto mediante los patrones visuales actuales y toast.
- Pruebas unitarias de los servicios, API y flujos principales de la página.

**Out of scope (specs futuros):**

- Cierre de caja, arqueo, detalle de cierre y diferencias por método de pago.
- Ingresos, egresos, ventas y asignación de una venta a una apertura.
- Reportes consolidados, exportaciones, auditorías avanzadas o métricas de caja.
- Eliminación física o lógica de una caja desde el frontend.
- Reapertura de una sesión cerrada.
- Un estado de activación independiente para personas; una persona operativa se determina por cuenta de acceso y rol.
- Búsqueda, paginación, ordenamiento o filtros adicionales en el listado de cajas o en el historial mensual.

## Data model

```ts
// ApiTienda/src/modules/cash/entities/cash-register.entity.ts
export class CashRegister {
  id: number;
  code: string;
  name: string;
  active: boolean;
  openings: CashRegisterOpening[];
}

// ApiTienda/src/modules/cash/entities/cash-register-opening.entity.ts
export class CashRegisterOpening {
  id: number;
  cashRegister: CashRegister;
  openedBy: Person;
  responsible: Person;
  openedAt: Date;
  status: CashOpeningStatus;
  openingAmount: string;
}
```

```ts
// ApiTienda/src/modules/cash/dtos/cash-register/create-cash-register.dto.ts
export class CreateCashRegisterDto {
  code: string;
  name: string;
}

// ApiTienda/src/modules/cash/dtos/cash-register/update-cash-register.dto.ts
export class UpdateCashRegisterDto {
  code?: string;
  name?: string;
  active?: boolean;
}

// ApiTienda/src/modules/cash/dtos/cash-register-opening/create-cash-register-opening.dto.ts
export class CreateCashRegisterOpeningDto {
  cashRegisterId: number;
  openingAmount: number;
  responsibleId?: number;
}
```

```ts
// FrontTienda/src/app/core/models/cash-register.model.ts
export interface CashRegister {
  id: number;
  code: string;
  name: string;
  active: boolean;
  openOpening: CashRegisterOpeningSummary | null;
}

export interface CashRegisterOpeningSummary {
  id: number;
  openedAt: string;
  openingAmount: number;
  status: 'open';
  responsible: CashResponsible;
}

export interface CashRegisterOpening {
  id: number;
  cashRegister: Pick<CashRegister, 'id' | 'code' | 'name' | 'active'>;
  openedBy: CashResponsible;
  responsible: CashResponsible;
  openedAt: string;
  status: 'open' | 'closed';
  openingAmount: number;
}

export interface CashResponsible {
  id: number;
  firstName: string;
  lastName: string;
}

export interface CreateCashRegister {
  code: string;
  name: string;
}

export interface UpdateCashRegister {
  code?: string;
  name?: string;
  active?: boolean;
}

export interface CreateCashRegisterOpening {
  cashRegisterId: number;
  openingAmount: number;
  responsibleId?: number;
}

export interface CashRegisterOpeningFilter {
  cashRegisterId: number;
  year: number;
  month: number;
}
```

```ts
// FrontTienda/src/app/core/api/cash-registers.service.ts
findAll(): Observable<CashRegister[]>;
create(dto: CreateCashRegister): Observable<CashRegister>;
update(id: number, dto: UpdateCashRegister): Observable<CashRegister>;

// FrontTienda/src/app/core/api/cash-register-openings.service.ts
findAll(filter: CashRegisterOpeningFilter): Observable<CashRegisterOpening[]>;
create(dto: CreateCashRegisterOpening): Observable<CashRegisterOpening>;

// FrontTienda/src/app/core/api/people.service.ts
findCashResponsibles(): Observable<CashResponsible[]>;
```

Convenciones:

- `code` y `name` se recortan antes de enviarse, son obligatorios y no pueden quedar vacíos después de aplicar `trim()`.
- El API impone unicidad de `CashRegister.code` y devuelve conflicto cuando se repite.
- El estado inicial de una caja creada es `active: true`.
- La activación y desactivación se realiza con `PATCH /cash-registers/:id` usando `active`; no existe borrado de cajas en esta spec.
- `openedBy` no se recibe desde el cliente y siempre se toma del JWT.
- `responsibleId` es opcional en el payload para permitir la apertura de un trabajador, pero el servicio resuelve y persiste siempre un responsable.
- El mes se representa con `year` de cuatro dígitos y `month` entre `1` y `12`; el API filtra por `openedAt` dentro de ese mes calendario local.
- La respuesta del API es la fuente de verdad después de crear, editar, abrir o recibir un conflicto.

## Implementation plan

1. En `ApiTienda`, agregar `code` único a `CashRegister` y `responsible` obligatorio a `CashRegisterOpening`; crear una migración nueva que complete las aperturas existentes con su `openedBy` como responsable antes de imponer la relación obligatoria.
2. En `ApiTienda`, extender DTOs y respuestas de caja con `code`, y permitir actualizar `code`, `name` y `active`; ajustar el servicio para recortar valores, rechazar códigos duplicados y conservar el acceso administrativo para crear y editar.
3. En `ApiTienda`, separar la lectura de cajas por rol: el administrador recibe todas las cajas y el trabajador solo las activas; incluir `openOpening` con id, fecha, monto y responsable cuando exista una apertura en estado `open`.
4. En `ApiTienda`, añadir la consulta de responsables operativos y protegerla para `ADMINISTRADOR`; devolver solamente personas no eliminadas con cuenta de acceso y rol `ADMINISTRADOR` o `TRABAJADOR`.
5. En `ApiTienda`, extender la apertura para resolver `openedBy` desde JWT y `responsible`: el administrador puede elegir una persona elegible y el trabajador queda asignado a sí mismo; devolver ambas personas, `openedAt`, monto y estado.
6. En `ApiTienda`, extender `GET /cash-register-openings` con `cashRegisterId`, `year` y `month`, validar sus rangos y devolver solo las aperturas de la caja cuyo `openedAt` corresponde al mes calendario solicitado, ordenadas de más reciente a más antigua.
7. En `ApiTienda`, añadir pruebas unitarias y/o e2e para código único, activación, visibilidad por rol, responsables permitidos, asignación forzada del trabajador, filtro mensual y conflicto de doble apertura.
8. En `FrontTienda`, crear `core/models/cash-register.model.ts`, `core/api/cash-registers.service.ts` y `core/api/cash-register-openings.service.ts`; extender `PeopleService` con la consulta de responsables y cubrir URLs, payloads, filtros y errores con pruebas unitarias.
9. En `FrontTienda`, crear la feature `feature/operaciones/cajas/` con componentes standalone para la lista de cajas, el diálogo reutilizable de creación y edición, el diálogo de apertura y la tabla de historial mensual.
10. En `FrontTienda`, crear `CajasPage` para cargar las cajas, mostrar los controles administrativos según los roles de la sesión, seleccionar una caja y solicitar su historial para el mes actual; mostrar un estado vacío cuando no exista ninguna apertura en el mes.
11. En `FrontTienda`, implementar la creación y edición administrativa: validar código y nombre recortados, crear cajas activas, actualizar el estado desde el mismo diálogo y reemplazar la caja local con la respuesta exitosa.
12. En `FrontTienda`, implementar la apertura: permitir únicamente cajas activas sin sesión abierta, cargar responsables solo para administradores, autocompletar su propia persona, asignar al trabajador como responsable de solo lectura y actualizar la caja e historial tras éxito o conflicto.
13. En `FrontTienda`, implementar la navegación mensual anterior/siguiente y la recarga del historial de la caja seleccionada; usar el mes calendario local actual como valor inicial.
14. En `FrontTienda`, registrar `/operaciones/cajas` en `app.routes.ts`, crear las rutas de `feature/operaciones/` y añadir el grupo **Operaciones** con la entrada **Cajas** en `DashboardService`.
15. Añadir pruebas unitarias de componentes y página para permisos, validaciones, apertura de administrador y trabajador, sesión ya abierta, conflicto, selección de caja, estados de carga/error/vacío e historial mensual; verificar con `npm run build` y `npm test` en ambos proyectos.

## Acceptance criteria

- [ ] Una migración nueva agrega `cash_register.code` único y la relación obligatoria de responsable en las aperturas, sin modificar migraciones históricas.
- [ ] Las aperturas existentes conservan como responsable a la misma persona que figura en `openedBy` después de aplicar la migración.
- [ ] Un administrador puede crear una caja con código y nombre obligatorios mediante `POST /cash-registers`.
- [ ] Una caja creada queda activa por defecto.
- [ ] Crear o editar una caja con un código repetido devuelve un conflicto y no modifica datos.
- [ ] Un administrador puede actualizar código, nombre y estado activo mediante `PATCH /cash-registers/:id`.
- [ ] Un trabajador recibe únicamente cajas activas al consultar las cajas.
- [ ] Un administrador recibe cajas activas e inactivas al consultar las cajas.
- [ ] La respuesta de una caja abierta incluye el resumen `openOpening` con su responsable y monto inicial.
- [ ] El endpoint de responsables devuelve únicamente personas no eliminadas, con cuenta de acceso y con rol `ADMINISTRADOR` o `TRABAJADOR`.
- [ ] Un administrador puede abrir una caja activa indicando un responsable elegible.
- [ ] La apertura realizada por administrador registra al administrador como `openedBy` y a la persona seleccionada como `responsible`.
- [ ] Un trabajador puede abrir una caja activa y queda registrado como `openedBy` y `responsible`.
- [ ] Un trabajador no puede asignar a otra persona como responsable aunque envíe un `responsibleId` distinto.
- [ ] Una caja inactiva no puede abrirse.
- [ ] La segunda apertura de una misma caja en estado `open` devuelve conflicto y no crea otra sesión.
- [ ] `GET /cash-register-openings?cashRegisterId=:id&year=:year&month=:month` devuelve solo aperturas cuyo `openedAt` pertenece al mes calendario solicitado.
- [ ] Cada fila del historial incluye fecha y hora de apertura, responsable, monto inicial y estado.
- [ ] La ruta `/operaciones/cajas` carga para un usuario autenticado.
- [ ] El menú lateral contiene el grupo **Operaciones** y la entrada **Cajas** navega a `/operaciones/cajas`.
- [ ] Un administrador puede crear, editar, activar y desactivar cajas desde la pantalla.
- [ ] Un trabajador no ve controles de creación, edición ni cambio de estado.
- [ ] El formulario de caja no permite enviar código o nombre vacíos después de aplicar `trim()`.
- [ ] El botón **Abrir caja** solo está disponible para una caja activa sin apertura abierta.
- [ ] El formulario de apertura no permite un monto inicial menor a cero.
- [ ] Para un administrador, el formulario de apertura muestra y exige un responsable operativo, inicialmente su propia persona.
- [ ] Para un trabajador, el responsable se muestra como su propia persona y no es editable.
- [ ] Tras abrir correctamente, la caja muestra su sesión abierta y el historial de la caja seleccionada se actualiza.
- [ ] Si la apertura devuelve conflicto, la pantalla muestra el error, recarga cajas e historial y bloquea la acción según la sesión abierta real.
- [ ] Al seleccionar una caja, su historial inicia en el mes calendario local actual.
- [ ] Los controles de mes solicitan y muestran el historial del mes anterior o siguiente de la caja seleccionada.
- [ ] El historial muestra un estado vacío cuando no hay aperturas para la caja y mes seleccionados.
- [ ] `npm run build` y `npm test` pasan en `FrontTienda`.
- [ ] `npm run build`, `npm run lint` y `npm test` pasan en `ApiTienda`.

## Decisions

- **Sí:** ubicar la pantalla en `Operaciones > Cajas`, porque la apertura es una operación diaria aunque incluya administración restringida a administradores.
- **Sí:** incluir cambios de `ApiTienda` junto con el frontend, porque el contrato actual no expone código, reactivación, responsable, fecha ni filtro mensual necesarios para el flujo.
- **Sí:** usar código manual y único para identificar cada caja.
- **Sí:** permitir editar código, nombre y estado en una única acción administrativa; no eliminar cajas para preservar el historial.
- **Sí:** mostrar todas las cajas al administrador y solo las activas al trabajador.
- **Sí:** conservar `openedBy` como auditoría de quien ejecutó la acción y agregar `responsible` para la persona a cargo de la caja.
- **Sí:** permitir al administrador seleccionar como responsable a una persona con cuenta y rol `ADMINISTRADOR` o `TRABAJADOR`.
- **Sí:** asignar forzosamente al trabajador autenticado como responsable de su propia apertura.
- **Sí:** bloquear la acción de apertura cuando ya exista una sesión abierta y mostrar su resumen en la caja.
- **Sí:** recargar cajas e historial tras un conflicto de doble apertura para reflejar el estado persistido.
- **Sí:** filtrar el historial por mes calendario local, comenzando en el mes actual y navegando con controles anterior/siguiente.
- **No:** usar solamente el endpoint existente de aperturas; no ofrece el responsable, fecha ni filtros requeridos.
- **No:** crear un campo `active` para personas; la elegibilidad se resuelve con cuenta de acceso y roles operativos existentes.
- **No:** incluir cierre, movimientos, ventas ni arqueo; cada flujo requiere su propia especificación de interfaz.

## Risks

| Risk                                                                         | Mitigation                                                                                                                      |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dos usuarios abren la misma caja simultáneamente.                            | Mantener la validación transaccional y la restricción de una sesión `open`; ante conflicto, el frontend recarga el estado real. |
| La migración no puede asignar responsable a aperturas históricas.            | Usar `openedBy` como responsable de las filas existentes antes de hacer obligatoria la relación.                                |
| Un administrador intenta asignar una persona sin acceso o sin rol operativo. | Validar la elegibilidad en el servidor, sin confiar en el selector del frontend.                                                |
| El cálculo del mes cambia según la zona horaria del servidor.                | Definir la zona horaria local del negocio para construir el rango mensual y probar límites de inicio y fin de mes.              |
| Una caja se desactiva mientras tiene una apertura abierta.                   | Mantener la apertura existente visible; la desactivación solo impide aperturas futuras y no crea ni cierra sesiones.            |

## What is **not** in this spec

- Cierre de caja, arqueo, diferencias y detalle por método de pago.
- Movimientos de ingreso o egreso, ventas y pagos.
- Eliminación o reapertura de cajas y sesiones.
- Reportes, auditorías, exportaciones y paginación o búsqueda del historial.
- Un estado de activación propio para personas.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
