# SPEC 13 — Mi caja, sesiones y movimientos

> **Status:** Borrador
> **Depends on:** SPEC 07 (cajas y aperturas), SPEC 10 (rol responsable y permisos operativos), SPEC 11 (navegación y rutas por rol), API `ApiTienda` SPEC 16 (cajas, sesiones y cierres)
> **Date:** 2026-09-12
> **Objective:** Separar la operación de caja propia, el historial de sesiones y los movimientos auditables con acceso limitado por responsable.

## Scope

**In:**

- Reemplazar la página única de cajas por `/caja/mi-caja`, `/caja/sesiones` y `/caja/movimientos`.
- Mostrar en `/caja/mi-caja` solo la sesión abierta donde la persona autenticada es `responsible`.
- Permitir a trabajador, responsable y administrador abrir su propia sesión en una caja activa sin otra apertura abierta.
- Permitir crear movimientos `income` y `expense` con importe positivo y motivo obligatorio desde la sesión propia abierta.
- Permitir cerrar la sesión propia con arqueo de todos los métodos de pago activos y mostrar esperado, real y diferencia por método.
- Mantener para administrador la apertura de una sesión asignada a otra persona desde `/caja/sesiones`.
- Exponer `GET /cash-movements` paginado con filtros `cashOpeningId`, `cashRegisterId`, `type`, `createdById`, `startDate`, `endDate`, `page` y `limit`.
- Añadir a la respuesta de movimiento fecha, caja, sesión, tipo, importe, motivo y persona creadora.
- Mostrar `/caja/sesiones` y `/caja/movimientos` solo a responsable y administrador.
- Mostrar en sesiones aperturas y cierres, responsable, quien abrió/cerró, importes agregados y detalle de arqueo cuando exista.
- Aplicar la propiedad de sesión por `responsible.id`; trabajador no puede leer ni afectar sesiones o movimientos ajenos.
- Añadir estados de carga, vacío, error, conflicto de sesión y éxito para los tres flujos.
- Validar las interfaces de apertura, movimiento, cierre, historial y permisos con MCP de Playwright.

**Out of scope (for future specs):**

- Aprobación, categorías, adjuntos, límites o reversión de movimientos manuales.
- Reapertura de una sesión cerrada.
- Transferencias entre cajas.
- Exportación de arqueos o movimientos.
- Reportes consolidados de caja.

## Data model

```ts
// ApiTienda/src/modules/cash/dtos/cash-movement/cash-movement-filter.dto.ts
export class CashMovementFilterDto extends PaginationDto {
  cashOpeningId?: number;
  cashRegisterId?: number;
  type?: CashMovementType;
  createdById?: number;
  startDate?: string;
  endDate?: string;
}

// FrontTienda/src/app/core/models/cash-movement.model.ts
export interface CashMovement {
  id: number;
  cashOpeningId: number;
  cashRegisterId: number;
  cashRegisterName: string;
  type: 'income' | 'expense';
  amount: number;
  reason: string;
  createdAt: string;
  createdById: number;
  createdByName: string;
}
```

Convenciones:

- El monto de un movimiento es positivo; el signo financiero se deduce de `type`.
- `income` aumenta el efectivo esperado y `expense` lo reduce conforme a SPEC 16 del API.
- Las fechas de filtros usan `America/Lima` y los límites inclusivos del rango seleccionado.
- Una sesión propia es aquella cuyo `responsible.id` coincide con `AuthStore.person().id`.
- Administrador puede abrir una sesión para otra persona solo desde `/caja/sesiones`; Mi caja nunca muestra un selector de responsable.
- Responsable y administrador pueden consultar el historial global; trabajador solo ve y opera su sesión propia.

Archivos principales:

- `ApiTienda/src/modules/cash/controllers/cash-movements.controller.ts`.
- `ApiTienda/src/modules/cash/services/cash-movements.service.ts`.
- `ApiTienda/src/modules/cash/dtos/cash-movement/`.
- `ApiTienda/src/modules/cash/dtos/cash-register-opening/`.
- `ApiTienda/src/modules/cash/services/cash-register-openings.service.ts`.
- `FrontTienda/src/app/core/models/cash-register.model.ts`.
- `FrontTienda/src/app/core/models/cash-movement.model.ts`.
- `FrontTienda/src/app/core/api/cash-register-openings.service.ts`.
- `FrontTienda/src/app/core/api/cash-movements.service.ts`.
- `FrontTienda/src/app/feature/caja/mi-caja/`.
- `FrontTienda/src/app/feature/caja/sesiones/`.
- `FrontTienda/src/app/feature/caja/movimientos/`.
- Pruebas de servicios, páginas, diálogos y controladores de caja.

## Implementation plan

1. Completar las DTO de salida de sesión para incluir los datos de apertura, cierre y detalle de arqueo que necesita el frontend.
2. Implementar el filtro paginado y `GET /cash-movements`; cargar relaciones necesarias y aplicar visibilidad según responsable, responsable o administrador.
3. Endurecer `POST /cash-movements` para impedir que trabajador cree un movimiento fuera de una sesión de la que es responsable.
4. Ajustar apertura y cierre para que trabajador y responsable operen sesiones propias; conservar la apertura administrativa asignada desde la consulta global de sesiones.
5. Añadir pruebas de API para filtro, paginación, permisos de propietario, cierre, movimiento y respuestas con auditoría.
6. Crear modelos y servicios Angular de movimientos y completar los contratos de sesión y cierre.
7. Implementar `/caja/mi-caja` con apertura propia, estado de sesión, registro de movimiento y diálogo de cierre con arqueo.
8. Implementar `/caja/sesiones` para historial global de responsable/admin y apertura administrativa asignada para administrador.
9. Implementar `/caja/movimientos` con filtros, tabla paginada y detalle de auditoría para responsable/admin.
10. Migrar o retirar los componentes de la página única de cajas solo cuando sus sustitutos estén conectados a las rutas nuevas.
11. Ejecutar pruebas y build; usar MCP de Playwright con trabajador, responsable y administrador para verificar accesos, apertura, movimiento, cierre e historial.

## Acceptance criteria

- [ ] `/caja/mi-caja` solo muestra una sesión cuya persona responsable sea la autenticada.
- [ ] Trabajador, responsable y administrador pueden abrir su propia sesión en una caja activa disponible.
- [ ] Un administrador puede abrir desde `/caja/sesiones` una sesión asignada a otra persona autorizada.
- [ ] Un trabajador no puede crear, consultar el detalle ni cerrar una sesión de otra persona.
- [ ] Un movimiento exige tipo válido, importe positivo y motivo no vacío.
- [ ] Un movimiento creado expone fecha, autor, sesión y caja en su respuesta.
- [ ] `GET /cash-movements` aplica filtros y paginación sin exponer movimientos ajenos a trabajador.
- [ ] Responsable y administrador pueden consultar movimientos y sesiones de todas las personas.
- [ ] El cierre exige un importe real para cada método activo y muestra esperado, real y diferencia por método.
- [ ] Una sesión cerrada no admite nuevos movimientos, ventas ni un segundo cierre.
- [ ] La interfaz presenta estados de carga, vacío y error para sesiones y movimientos.
- [ ] Los flujos de los tres roles se validan con MCP de Playwright sin errores de consola.
- [ ] Los builds y pruebas definidos de ambos repositorios pasan.

## Decisions

- **Sí:** separar Mi caja de las consultas administrativas para que la operación diaria sea clara y segura.
- **Sí:** determinar propiedad por `responsible.id`, no por quien realizó la apertura.
- **Sí:** permitir creación y listado de movimientos sin aprobaciones ni categorías nuevas.
- **Sí:** reservar la apertura para otra persona al administrador y ubicarla en Sesiones.
- **Sí:** mostrar sesiones abiertas y cerradas; los detalles de arqueo solo existen al cerrar.
- **No:** permitir a trabajador revisar o modificar operaciones de otra sesión.
- **No:** implementar reversión, comprobantes o límites monetarios de movimientos.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un movimiento manual altera el arqueo de una caja ajena. | Validar propiedad en servicio, además del filtro visible de interfaz. |
| Dos usuarios intentan abrir la misma caja. | Reutilizar la validación transaccional de una sola sesión abierta por caja. |
| Un cierre ocurre mientras la interfaz registra un movimiento. | El API valida estado abierto y responde conflicto sin persistir datos parciales. |
| El filtro de fechas mezcla días operativos. | Aplicar la misma política `America/Lima` de historial y reportes. |

## What is **not** in this spec

- Aprobaciones, categorías, adjuntos o reversión de movimientos.
- Reapertura y transferencias entre cajas.
- Reportes financieros consolidados.
- Exportación de sesiones o arqueos.
- Realtime de caja.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
