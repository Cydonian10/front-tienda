# SPEC 15 — Reportes de productos, pagos y cajas

> **Status:** Borrador
> **Depends on:** SPEC 13 (mi caja, sesiones y movimientos), SPEC 14 (reportes de resumen, ventas y vendedores)
> **Date:** 2026-09-12
> **Objective:** Completar los reportes operativos con rankings de productos, distribución de pagos y estado consolidado de sesiones de caja.

## Scope

**In:**

- Exponer `GET /reports/products`, `GET /reports/payment-methods` y `GET /reports/cash-registers` en `ReportsModule`.
- Crear `/reportes/productos`, `/reportes/metodos-pago` y `/reportes/cajas` para responsable y administrador.
- Agrupar productos por producto base o variante vendida y mostrar cantidad equivalente en unidad principal y facturación `PAID`.
- Ordenar el ranking principal de productos por `quantityBase` descendente y usar facturación como segundo criterio.
- Mostrar distribución de métodos de pago con importe `PAID`, número de operaciones y porcentaje sobre ventas pagadas.
- Mostrar sesiones cerradas por `closedAt` dentro del rango y sesiones abiertas actuales separadas de los arqueos finalizados.
- Mostrar por sesión cerrada caja, responsable, apertura, cierre, esperado, real, diferencia y detalle por método de pago.
- Mostrar por sesión abierta caja, responsable, apertura y saldo esperado operativo actual sin incluirla en totales cerrados.
- Reutilizar los presets y filtros temporales de reportes con límites `America/Lima`.
- Aplicar carga, vacío, error y reintento por consulta.
- Validar cada interfaz y sus restricciones de rol mediante MCP de Playwright.

**Out of scope (for future specs):**

- Costos, margen, utilidad o valorización de inventario.
- Stock mínimo y alertas de reposición.
- Desglose de pagos mixtos.
- Exportación de reportes o arqueos.
- Modificación de sesiones cerradas desde reportes.

## Data model

```ts
// ApiTienda/src/modules/reports/dtos/products-report.dto.ts
export interface ProductReportDto {
  productId: number;
  productName: string;
  quantityBase: number;
  paidAmount: number;
  paidCount: number;
}

export interface PaymentMethodReportDto {
  paymentMethodId: number;
  name: string;
  paidAmount: number;
  paidCount: number;
  percentage: number;
}

export interface CashRegisterReportDto {
  closedSessions: Array<{
    openingId: number;
    cashRegisterId: number;
    cashRegisterName: string;
    responsibleName: string;
    openedAt: string;
    closedAt: string;
    expectedAmount: number;
    realAmount: number;
    difference: number;
    closingDetails: ClosingDetail[];
  }>;
  openSessions: Array<{
    openingId: number;
    cashRegisterId: number;
    cashRegisterName: string;
    responsibleName: string;
    openedAt: string;
    expectedAmount: number;
  }>;
}
```

Convenciones:

- `quantityBase` suma `SaleDetail.quantity * SaleDetail.unitFactor` y representa unidades principales equivalentes.
- Las líneas de ventas canceladas no aportan cantidad, importe ni conteo de ventas en reportes de producto y pago.
- Métodos de pago usan pagos cuyo estado sea `PAID`.
- Sesiones cerradas se filtran por `closedAt` dentro del rango; sesiones abiertas son el estado actual y no se suman al arqueo histórico.
- Los totales de cierres salen de importes persistidos al cerrar, no de un recálculo desde reportes.
- Los datos operativos se expresan en horario `America/Lima`.

Archivos principales:

- `ApiTienda/src/modules/reports/controllers/reports.controller.ts`.
- `ApiTienda/src/modules/reports/services/reports.service.ts`.
- `ApiTienda/src/modules/reports/dtos/`.
- `FrontTienda/src/app/core/models/report.model.ts`.
- `FrontTienda/src/app/core/api/reports.service.ts`.
- `FrontTienda/src/app/feature/reportes/productos/`.
- `FrontTienda/src/app/feature/reportes/metodos-pago/`.
- `FrontTienda/src/app/feature/reportes/cajas/`.
- Pruebas de API, servicios y componentes de reportes.

## Implementation plan

1. Añadir las DTO de respuesta y los parámetros de rango compartidos para productos, métodos de pago y cajas.
2. Implementar consulta de productos que convierta cada detalle a cantidad principal, ignore cancelaciones y ordene por cantidad base e importe.
3. Implementar consulta de métodos de pago usando pagos `PAID` y calculando porcentaje seguro para total cero.
4. Implementar consulta de cajas que separe sesiones cerradas por `closedAt` de sesiones abiertas actuales e incluya detalles de cierre persistidos.
5. Exponer las tres rutas con autorización de responsable/admin y documentarlas en Swagger.
6. Añadir pruebas de conversiones de unidades, cancelaciones, total cero, cierres dentro y fuera de rango, y sesión abierta separada.
7. Extender modelos y `ReportsService` de Angular con los nuevos contratos.
8. Crear las tres páginas de reportes y reutilizar el filtro temporal, tablas y estados de consulta comunes cuando aplique.
9. Ejecutar build y pruebas; validar con MCP de Playwright filtros, filas vacías, resultados y acceso denegado a trabajador.

## Acceptance criteria

- [ ] Las tres rutas de reportes rechazan a trabajador con `403`.
- [ ] Un producto vendido en presentación multiplica correctamente la cantidad por su factor para `quantityBase`.
- [ ] Una venta cancelada no contribuye al ranking de productos ni a métodos de pago.
- [ ] Productos se ordenan por cantidad base y después por facturación de forma determinista.
- [ ] Cada método de pago devuelve importe, número de pagos y porcentaje correcto.
- [ ] Cuando no hay pagos, los porcentajes son `0` y la consulta no falla.
- [ ] Las sesiones cerradas aparecen solo cuando `closedAt` está dentro del rango.
- [ ] Las sesiones abiertas se muestran separadas y no se agregan a los arqueos cerrados.
- [ ] Una sesión cerrada presenta esperado, real, diferencia y detalle por método persistidos.
- [ ] Las páginas usan `America/Lima` y presentan estados de carga, vacío y error.
- [ ] MCP de Playwright valida los reportes con responsable/admin y el bloqueo de trabajador sin errores de consola.
- [ ] Los builds y pruebas de ambos repositorios pasan.

## Decisions

- **Sí:** medir cantidad vendida en unidades principales equivalentes para comparar presentaciones distintas.
- **Sí:** mostrar facturación junto a cantidad para distinguir volumen de importe vendido.
- **Sí:** basar métodos de pago únicamente en pagos confirmados.
- **Sí:** separar sesiones abiertas de cierres históricos para evitar arqueos incompletos en los totales.
- **No:** calcular costos o márgenes; el modelo actual no define costo de venta histórico.
- **No:** modificar arqueos desde los reportes.
- **No:** implementar exportación o pagos mixtos.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Cambios de factor de unidad alteran la lectura de ventas antiguas. | Usar la instantánea `unitFactor` persistida en `SaleDetail`. |
| Una sesión abierta se interpreta como cierre final. | Devolverla en una colección distinta y excluirla de los totales cerrados. |
| La consulta de detalles de cierre crece con el rango. | Paginar o limitar la tabla de sesiones si las mediciones de producción lo requieren. |

## What is **not** in this spec

- Costos, utilidad, margen o stock mínimo.
- Exportación y edición de arqueos.
- Pagos mixtos.
- Alertas realtime.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
