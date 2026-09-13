# SPEC 12 — Historial de ventas y resumen por período

> **Status:** Implementado
> **Depends on:** SPEC 08 (página de ventas y cobro), SPEC 09 (ventas por unidad de medida), SPEC 10 (rol responsable y permisos operativos), SPEC 11 (navegación y rutas por rol), API `ApiTienda` SPEC 17 (ventas pendientes, pago y cancelación)
> **Date:** 2026-09-12
> **Objective:** Separar el punto de venta del historial y mostrar ventas y métricas de períodos calculadas por el API en horario `America/Lima`.

## Scope

**In:**

- Mover el POS actual a `/ventas/nueva` y conservar catálogo, carrito, cliente, sesión, guardado pendiente, pago, edición y cancelación.
- Extraer `SalesFilters` y `SalesHistoryTable` de la página de POS hacia `/ventas/historial`.
- Permitir `/ventas/historial` únicamente a `RESPONSABLE` y `ADMINISTRADOR` mediante rutas Angular y autorización backend.
- Mostrar en el POS un panel compacto de ventas recientes propias para `TRABAJADOR`, sin filtros globales ni acceso al historial general.
- Crear `ReportsModule` mínimo en `ApiTienda` y exponer `GET /reports/sales-summary` para calcular métricas por rango.
- Mostrar en historial accesos rápidos Hoy, Esta semana, Este mes y Personalizado.
- Permitir navegar el período diario mediante día anterior y siguiente, sin permitir un día futuro.
- Mostrar ventas cobradas, número de ventas cobradas, ticket promedio, cantidad de cancelaciones e importe cancelado para el rango consultado.
- Mantener la tabla paginada de `GET /sales` como fuente de filas y el resumen agregado como fuente de KPI.
- Usar límites de día, semana y mes de `America/Lima` para construir y validar todos los rangos.
- Conservar filtros de estado, caja, vendedor y fechas en el historial; solo responsable y administrador pueden cambiar el vendedor.
- Añadir estados de carga, vacío, error y reintento independientes para resumen y tabla.
- Validar flujos de interfaz por rol y período usando el MCP de Playwright contra los servicios locales.

**Out of scope (for future specs):**

- Paneles generales de reportes, gráficos y rankings.
- Exportación de historial.
- Historial detallado accesible a trabajador.
- Persistencia del período o filtros en `localStorage`.
- Actualización en tiempo real del resumen.

## Data model

```ts
// ApiTienda/src/modules/reports/dtos/sales-summary.dto.ts
export class SalesSummaryDto {
  from: string;
  to: string;
  paidAmount: number;
  paidCount: number;
  averageTicket: number;
  cancelledCount: number;
  cancelledAmount: number;
}

// FrontTienda/src/app/core/models/report.model.ts
export interface SalesSummary {
  from: string;
  to: string;
  paidAmount: number;
  paidCount: number;
  averageTicket: number;
  cancelledCount: number;
  cancelledAmount: number;
}

// FrontTienda/src/app/core/api/reports.service.ts
findSalesSummary(from: string, to: string): Observable<SalesSummary>;
```

Convenciones:

- `from` y `to` son fechas ISO de calendario local `America/Lima` con límites inclusivos de inicio y fin de período.
- `paidAmount`, `paidCount` y `averageTicket` solo usan ventas `PAID`.
- `cancelledCount` e `cancelledAmount` se calculan por separado con ventas `CANCELLED` y no reducen los KPI de ventas cobradas.
- Si no existen ventas `PAID`, `averageTicket` es `0`.
- El API agrega en PostgreSQL/TypeORM; Angular no recorre páginas de `GET /sales` para calcular métricas.
- El panel compacto de POS usa la restricción existente del API para obtener solamente ventas propias de trabajador.

Archivos principales:

- `ApiTienda/src/modules/reports/reports.module.ts`.
- `ApiTienda/src/modules/reports/controllers/reports.controller.ts`.
- `ApiTienda/src/modules/reports/services/reports.service.ts`.
- `ApiTienda/src/modules/reports/dtos/sales-summary.dto.ts`.
- `ApiTienda/src/app.module.ts`.
- `FrontTienda/src/app/core/models/report.model.ts`.
- `FrontTienda/src/app/core/api/reports.service.ts`.
- `FrontTienda/src/app/feature/ventas/pos/pages/venta.page.ts` y `.html`.
- `FrontTienda/src/app/feature/ventas/historial/pages/historial-ventas.page.ts` y `.html`.
- `FrontTienda/src/app/feature/ventas/historial/components/sales-filters/`.
- `FrontTienda/src/app/feature/ventas/historial/components/sales-history-table/`.
- `FrontTienda/src/app/feature/ventas/historial/components/sales-summary/`.
- Pruebas de reportes, POS, historial, filtros y tabla.

## Implementation plan

1. Crear `ReportsModule` mínimo y registrar el controlador y servicio en `AppModule` sin alterar los contratos existentes de ventas.
2. Implementar `GET /reports/sales-summary?from=&to=` con validación de fechas, zona horaria `America/Lima`, autorización de responsable o administrador y agregaciones de ventas `PAID` y `CANCELLED`.
3. Añadir pruebas del servicio y controlador para rango diario vacío, ventas pagadas, canceladas, ticket promedio, límites de día y acceso prohibido a trabajador.
4. Crear los modelos y `ReportsService` del frontend para el resumen y cubrir el contrato HTTP con pruebas.
5. Reubicar los componentes actuales del POS bajo `feature/ventas/pos/` y eliminar de esa página el historial global y sus filtros.
6. Añadir al POS el panel de ventas recientes propias para trabajador y conservar los mensajes de error sin perder el carrito.
7. Crear la página y ruta `/ventas/historial`, mover filtros y tabla, y conectarlas con `SalesService.findAll` y `ReportsService.findSalesSummary`.
8. Implementar presets de período, selector personalizado y navegación diaria; cada cambio actualiza resumen y tabla sin usar cálculos de cliente.
9. Añadir estados de carga, vacío, error, reintento y paginación independiente para cada fuente de datos.
10. Ejecutar pruebas unitarias y build; con servicios locales, usar el MCP de Playwright para validar POS de trabajador e historial de responsable/admin, incluyendo cambios de período y acceso denegado.

## Acceptance criteria

- [x] `/ventas/nueva` conserva la creación, edición, cobro y cancelación de ventas existentes.
- [x] El POS ya no muestra filtros ni tabla de historial general.
- [x] Un trabajador ve un panel de sus ventas recientes en el POS y no puede navegar al historial general.
- [x] Un responsable y un administrador pueden abrir `/ventas/historial`.
- [x] `GET /reports/sales-summary` rechaza a trabajador con `403`.
- [x] El resumen usa exclusivamente ventas `PAID` para importe, conteo y ticket promedio.
- [x] El resumen muestra conteo e importe de cancelaciones por separado.
- [x] Con cero ventas pagadas, el ticket promedio es exactamente `0`.
- [x] Los accesos rápidos construyen rangos correctos de Hoy, Esta semana y Este mes en `America/Lima`.
- [x] La navegación diaria no permite seleccionar una fecha futura.
- [x] Cambiar rango, filtro o página no obliga a calcular KPI desde las filas paginadas.
- [x] Tabla y resumen muestran estados de carga, vacío y error independientes.
- [x] La tabla conserva filtros de estado, caja, vendedor y fechas autorizados.
- [x] Las pruebas pasan y los flujos descritos se validan manualmente con MCP de Playwright sin errores de consola.

## Decisions

- **Sí:** separar el historial del POS para reducir responsabilidades de la página de venta.
- **Sí:** conservar una vista compacta de ventas propias en el POS para no quitar a trabajador su capacidad de consulta.
- **Sí:** usar un endpoint agregado para KPI y conservar `GET /sales` para la tabla paginada.
- **Sí:** aplicar `America/Lima` como calendario operativo común para historial y reportes.
- **Sí:** usar ventas `PAID` para ventas efectivas y exponer cancelaciones por separado.
- **No:** permitir que trabajador acceda a filtros globales o ventas de otras personas.
- **No:** guardar filtros de historial entre sesiones.
- **No:** introducir gráficos, exportaciones ni sockets en esta entrega.

## Risks

| Riesgo                                                   | Mitigación                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| La zona horaria del servidor cambia el límite operativo. | Construir y probar rangos explícitamente para `America/Lima`.             |
| La tabla y el resumen no usan el mismo rango.            | Derivar ambas solicitudes desde un único estado de período de la página.  |
| Un trabajador manipula la URL del historial.             | Aplicar `roleGuard` en Angular y `@Roles` en el controlador de reportes.  |
| Un rango personalizado es inválido.                      | Validar `from <= to` antes de consultar y devolver un error de API claro. |

## What is **not** in this spec

- Dashboard general y rankings.
- Reportes de productos, pagos y cajas.
- Exportaciones.
- Realtime.
- Persistencia local de filtros.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
