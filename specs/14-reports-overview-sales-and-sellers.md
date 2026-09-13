# SPEC 14 — Reportes de resumen, ventas y vendedores

> **Status:** Aprobado
> **Depends on:** SPEC 10 (rol responsable y permisos operativos), SPEC 11 (navegación y rutas por rol), SPEC 12 (historial de ventas y resumen por período)
> **Date:** 2026-09-12
> **Objective:** Ofrecer reportes agregados de ventas efectivas, evolución diaria y rendimiento de vendedores para responsables y administradores.

## Scope

**In:**

- Ampliar `ReportsModule` con `GET /reports/overview`, `GET /reports/sales-by-day` y `GET /reports/sellers`.
- Exigir rango `from` y `to`, o aplicar el período semanal actual de `America/Lima` cuando la ruta de resumen no reciba rango.
- Autorizar exclusivamente a `RESPONSABLE` y `ADMINISTRADOR`.
- Mostrar `/reportes/resumen` con ventas cobradas, transacciones, ticket promedio, cancelaciones, mejor vendedor, producto principal y distribución de métodos de pago.
- Mostrar `/reportes/ventas` con importes y cantidad de ventas cobradas agrupados por cada día del rango.
- Mostrar `/reportes/vendedores` con vendedor, importe vendido, número de ventas, ticket promedio, cantidad e importe cancelado.
- Reutilizar un filtro de rango con Hoy, Esta semana, Este mes y período personalizado en las tres páginas.
- Calcular todos los agregados en PostgreSQL/TypeORM a partir de ventas y pagos persistidos.
- Mantener cancelaciones separadas de ventas efectivas.
- Añadir estados de carga, vacío, error y reintento en cada página.
- Validar páginas, filtros y prohibición de acceso de trabajador con MCP de Playwright.

**Out of scope (for future specs):**

- Páginas detalladas de productos, métodos de pago y cajas.
- Exportación CSV, PDF o impresión.
- Comparación con períodos anteriores, metas o alertas.
- Actualización por sockets.
- Cálculo de métricas en Angular desde listas paginadas.

## Data model

```ts
// ApiTienda/src/modules/reports/dtos/reports.dto.ts
export interface ReportRangeDto {
  from: string;
  to: string;
}

export interface ReportsOverviewDto {
  paidAmount: number;
  paidCount: number;
  averageTicket: number;
  cancelledAmount: number;
  cancelledCount: number;
  topSeller: { sellerId: number; sellerName: string; paidAmount: number } | null;
  topProduct: { productId: number; productName: string; quantityBase: number } | null;
  paymentMethods: Array<{
    paymentMethodId: number;
    name: string;
    paidAmount: number;
    percentage: number;
  }>;
}

export interface SalesByDayDto {
  date: string;
  paidAmount: number;
  paidCount: number;
  cancelledAmount: number;
  cancelledCount: number;
}

export interface SellerReportDto {
  sellerId: number;
  sellerName: string;
  paidAmount: number;
  paidCount: number;
  averageTicket: number;
  cancelledAmount: number;
  cancelledCount: number;
}
```

Convenciones:

- Todas las consultas aplican `America/Lima` para el rango temporal.
- La métrica efectiva se basa solo en ventas y pagos `PAID`.
- La anulación se cuenta y suma por separado con el estado `CANCELLED`.
- Las series incluyen cada día del rango incluso si sus métricas son cero.
- El mejor vendedor se ordena por `paidAmount` descendente y usa el nombre disponible de su persona.
- Los empates se resuelven por ID ascendente para obtener resultados deterministas.
- Porcentaje de método de pago es `paidAmount / totalPaidAmount * 100`; si el total es cero, todos los porcentajes son cero.

Archivos principales:

- `ApiTienda/src/modules/reports/controllers/reports.controller.ts`.
- `ApiTienda/src/modules/reports/services/reports.service.ts`.
- `ApiTienda/src/modules/reports/dtos/`.
- `ApiTienda/src/modules/reports/reports.module.ts`.
- `FrontTienda/src/app/core/models/report.model.ts`.
- `FrontTienda/src/app/core/api/reports.service.ts`.
- `FrontTienda/src/app/feature/reportes/resumen/`.
- `FrontTienda/src/app/feature/reportes/ventas/`.
- `FrontTienda/src/app/feature/reportes/vendedores/`.
- `FrontTienda/src/app/feature/reportes/components/report-period-filter/`.
- Pruebas de consultas agregadas, servicios y páginas de reportes.

## Implementation plan

1. Extraer una DTO de rango y una utilidad compartida que convierta el período solicitado a límites válidos de `America/Lima`.
2. Implementar las consultas agregadas de resumen, serie diaria y vendedores usando repositorios TypeORM o QueryBuilder, sin paginar ni transferir todas las ventas al cliente.
3. Completar `GET /reports/overview`, `GET /reports/sales-by-day` y `GET /reports/sellers` con decoradores Swagger, roles y respuestas tipadas.
4. Cubrir API con datos de ventas pagadas, canceladas, días sin ventas, múltiples vendedores, empates, rango vacío y usuario trabajador no autorizado.
5. Extender `ReportsService` y los modelos Angular con los tres contratos.
6. Crear un componente reutilizable de período y conectarlo a las rutas Resumen, Ventas y Vendedores.
7. Implementar el resumen con tarjetas KPI y resúmenes de vendedor, producto y métodos de pago recibidos del API.
8. Implementar la serie diaria de ventas y la tabla de rendimiento de vendedores, con estados de carga, vacío y error.
9. Ejecutar pruebas y build; validar con MCP de Playwright los tres reportes para responsable/admin y el rechazo de ruta para trabajador.

## Acceptance criteria

- [ ] Las tres rutas de API devuelven datos únicamente a responsable y administrador.
- [ ] Un trabajador recibe `403` al solicitar cualquier endpoint de reportes de esta spec.
- [ ] `paidAmount`, `paidCount` y `averageTicket` ignoran ventas canceladas.
- [ ] Cancelaciones devuelven conteo e importe separados.
- [ ] La serie incluye todos los días del rango en `America/Lima`, incluso con cero ventas.
- [ ] El ranking de vendedores contiene importe, ventas, ticket promedio y cancelaciones por vendedor.
- [ ] El mejor vendedor del resumen coincide con la primera fila ordenada de vendedores para el mismo rango.
- [ ] Un rango sin ventas devuelve números cero y colecciones válidas, sin errores de servidor.
- [ ] Las páginas Resumen, Ventas y Vendedores comparten los mismos presets y rango personalizado.
- [ ] Ninguna página solicita páginas de `GET /sales` para calcular sus métricas.
- [ ] La interfaz muestra estados de carga, vacío y error verificables.
- [ ] MCP de Playwright valida los flujos autorizados y el bloqueo de trabajador sin errores de consola.
- [ ] Los builds y pruebas de ambos repositorios pasan.

## Decisions

- **Sí:** crear agregaciones REST específicas en vez de reutilizar el historial paginado.
- **Sí:** usar ventas pagadas como única base de ingresos y exponer cancelaciones separadas.
- **Sí:** centralizar los límites temporales en `America/Lima`.
- **Sí:** incluir top vendedor, producto y métodos de pago en el resumen para entregar el dashboard semanal solicitado.
- **Sí:** dividir los reportes detallados de productos, pagos y cajas en SPEC 15 para mantener esta entrega verificable.
- **No:** incluir exportación, metas o comparación histórica.
- **No:** enviar el estado del dashboard por WebSocket.

## Risks

| Riesgo                                                     | Mitigación                                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Consultas agregadas lentas en períodos extensos.           | Restringir el rango validado y agregar índices solo si la medición lo justifica.                                                |
| Los distintos endpoints discrepan en los límites de fecha. | Reutilizar una misma utilidad de rango y pruebas con límites diarios.                                                           |
| Un producto o persona fue renombrado después de vender.    | Documentar que los reportes usan los nombres actualmente relacionados hasta que exista un requisito de instantáneas de reporte. |

## What is **not** in this spec

- Reportes detallados de productos, pagos y cajas.
- Exportación y comparación entre períodos.
- Dashboard personal de Inicio.
- Sockets o alertas de stock.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
