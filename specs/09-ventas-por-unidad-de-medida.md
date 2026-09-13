# SPEC 09 — Ventas por unidad de medida

> **Status:** Aprobado
> **Depends on:** SPEC 08 (página de ventas y cobro), API `ApiTienda` SPEC 09 (unidades en base-products), API `ApiTienda` SPEC 17 (ventas pendientes, pago y cancelación).
> **Date:** 2026-09-11
> **Objective:** Permitir vender un mismo producto por cualquiera de las unidades de su producto base, convirtiendo cantidad, precio y stock mediante su factor.

## Scope

**In:**

- Cambios en `ApiTienda` y en `FrontTienda` para elegir la unidad de venta de cada producto en `Operaciones > Ventas`.
- `GET /products` y `GET /products/:id` exponen las unidades del producto base, con identificador, nombre, abreviatura, factor e indicador `isMain`.
- Cada detalle enviado a `POST /sales` y `PATCH /sales/:id` incluye `productId`, `unitId` y `quantity`.
- La unidad elegida debe pertenecer al producto base del producto solicitado; una unidad inexistente o ajena se rechaza en el API.
- La cantidad de una presentación acepta números positivos con hasta dos decimales.
- El precio de una presentación se calcula en el servidor como `round2(product.price * unit.factor)`.
- El subtotal de la línea se calcula en el servidor como `round2(unitPrice * quantity)`.
- El stock requerido y descontado se calcula como `quantity * unit.factor` en unidades principales.
- `Product.stock` pasa a precisión de cuatro decimales para conservar conversiones entre una cantidad y un factor de hasta dos decimales.
- El servidor valida el stock consolidado por producto cuando una venta contiene varias líneas del mismo producto en distintas presentaciones.
- Cada `SaleDetail` conserva la unidad vendida mediante su relación y una instantánea de nombre, abreviatura y factor.
- El carrito permite líneas independientes para el mismo producto cuando sus unidades son distintas.
- El catálogo permite seleccionar una unidad antes de agregar el producto al carrito y muestra el stock principal junto con la disponibilidad equivalente de la presentación seleccionada.
- El carrito permite modificar la cantidad decimal y cambiar la unidad de una línea mientras la venta está `PENDING`.
- El carrito, los totales, el detalle de venta y el historial muestran la presentación usada y el precio de esa presentación.
- Una migración nueva elimina las ventas existentes de desarrollo y sus pagos y movimientos relacionados antes de aplicar los cambios de esquema.
- Pruebas unitarias de los contratos, cálculos, validaciones y flujos de interfaz modificados.

**Out of scope (specs futuros):**

- Precios manuales o específicos por presentación; el único precio de origen sigue siendo `Product.price` de la unidad principal.
- Descuentos distintos por unidad o por línea.
- Conversión automática de productos entre sí.
- Unidades con más de dos decimales en el factor o en la cantidad vendida.
- Stock negativo, reservas de stock o alertas de inventario bajo.
- Conservación, migración o consulta de las ventas existentes antes de esta migración de desarrollo.
- Cambios al flujo de pagos, cancelación, caja, tickets, reportes o devoluciones.

## Data model

```ts
// ApiTienda/src/modules/sales/dtos/sale/create-sale.dto.ts
export class CreateSaleDetailDto {
  productId: number;
  unitId: number;
  quantity: number; // > 0, máximo dos decimales
}

// ApiTienda/src/modules/sales/dtos/sale/update-sale.dto.ts
export class UpdateSaleDetailDto {
  productId: number;
  unitId: number;
  quantity: number; // > 0, máximo dos decimales
}

// ApiTienda/src/modules/products/entities/producto.entity.ts
export class Product {
  stock: string; // decimal(12,4)
  price: string; // decimal(10,2), precio de la unidad principal
}

// ApiTienda/src/modules/sales/entities/sale-detail.entity.ts
export class SaleDetail {
  product: Product;
  unit: MeasurementUnit;
  unitName: string;
  unitValue: string;
  unitFactor: string; // decimal(10,2)
  quantity: string; // decimal(12,2)
  unitPrice: string; // precio de la presentación, decimal(10,2)
  subtotal: string; // decimal(10,2)
}
```

```ts
// FrontTienda/src/app/core/models/product.model.ts
export interface ProductUnit {
  unitId: number;
  unitName: string;
  unitValue: string;
  factor: number;
  isMain: boolean;
}

export interface Product {
  id: number;
  stock: number;
  price: number;
  baseProductId: number;
  baseProductName: string;
  productAttributes: ProductAttribute[];
  units: ProductUnit[];
}
```

```ts
// FrontTienda/src/app/core/models/sale.model.ts
export interface SaleDetail {
  id: number;
  productId: number;
  productName: string;
  unitId: number;
  unitName: string;
  unitValue: string;
  unitFactor: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateSaleDetail {
  productId: number;
  unitId: number;
  quantity: number;
}

export interface SaleCartLine {
  product: Product;
  unit: ProductUnit;
  quantity: number;
}
```

Convenciones:

- `Product.price` expresa el precio de una unidad principal.
- Una unidad principal tiene `factor: 1`.
- El precio de una presentación se redondea a dos decimales antes de multiplicarlo por su cantidad.
- El stock equivalente de una presentación se calcula como `product.stock / unit.factor` y se muestra sin modificar el stock real.
- La validación y el descuento de stock usan `quantity * unit.factor`; ese resultado se persiste en un stock de cuatro decimales.
- La clave única del carrito es la pareja `(product.id, unit.unitId)`.
- Los datos de unidad de `SaleDetail` son una instantánea; editar una unidad después no altera una venta existente.
- La nueva migración elimina primero los registros dependientes de ventas, incluidos pagos y movimientos de caja asociados, y después las ventas y sus detalles; no se modifican migraciones históricas.

Archivos principales del frontend:

- `src/app/core/models/product.model.ts`.
- `src/app/core/models/sale.model.ts`.
- `src/app/feature/operaciones/ventas/pages/ventas.page.ts` y `.html`.
- `src/app/feature/operaciones/ventas/components/sales-product-picker/sales-product-picker.ts` y `.html`.
- `src/app/feature/operaciones/ventas/components/sale-cart/sale-cart.ts` y `.html`.
- Pruebas de `ventas.page`, `sales-product-picker` y `sale-cart`.

Archivos principales del API:

- `ApiTienda/src/modules/products/entities/producto.entity.ts`.
- `ApiTienda/src/modules/products/dtos/product/product.dto.ts`.
- `ApiTienda/src/modules/sales/entities/sale-detail.entity.ts`.
- `ApiTienda/src/modules/sales/dtos/sale/create-sale.dto.ts`.
- `ApiTienda/src/modules/sales/dtos/sale/update-sale.dto.ts`.
- `ApiTienda/src/modules/sales/dtos/sale/sale.dto.ts`.
- `ApiTienda/src/modules/sales/services/sales.service.ts`.
- `ApiTienda/src/database/migrations/<timestamp>-SalesMeasurementUnits.ts`.
- Pruebas de DTO, servicio y controlador de ventas.

## Implementation plan

1. En `ApiTienda`, crear una migración nueva que borre en orden seguro las ventas existentes de desarrollo, sus detalles, pagos y movimientos relacionados; cambiar la precisión de `product.stock` a cuatro decimales y la de `sale_detail.quantity` a dos decimales.
2. En `ApiTienda`, agregar a `SaleDetail` la instantánea `unitName`, `unitValue` y `unitFactor`; conservar la relación obligatoria con `MeasurementUnit` y actualizar la migración nueva para crear las columnas requeridas.
3. En `ApiTienda`, extender `ProductDto` para devolver el arreglo `units` con `unitId`, `unitName`, `unitValue`, `factor` e `isMain` al listar y consultar un producto.
4. En `ApiTienda`, extender los DTOs de creación y edición de detalle con `unitId`; validar número positivo y un máximo de dos decimales para `quantity`.
5. En `ApiTienda`, cambiar `SalesService.replaceDetails` para cargar y validar la unidad solicitada contra las unidades del producto base, calcular precio, subtotal y cantidad principal, consolidar el stock requerido por producto y crear detalles con la instantánea de unidad.
6. En `ApiTienda`, aplicar la misma conversión de cantidad durante el pago y la cancelación para descontar o restaurar el stock de cuatro decimales dentro de sus transacciones.
7. En `ApiTienda`, extender `SaleDetailDto` y `SaleDto.fromEntity` con los datos de presentación y cargar las relaciones necesarias al consultar, editar, pagar o cancelar ventas.
8. En `ApiTienda`, cubrir con pruebas las validaciones de DTO, unidad ajena, cantidad decimal, redondeo, líneas repetidas por presentación, consolidación de stock, pago y cancelación; verificar el contrato de productos con sus unidades.
9. En `FrontTienda`, extender `Product`, `SaleDetail`, `CreateSaleDetail`, `UpdateSaleDetail` y `SaleCartLine` para transportar la unidad seleccionada y sus valores de cálculo.
10. En `FrontTienda`, actualizar `SalesProductPicker` para mostrar un selector de las unidades del producto, el precio calculado y el stock principal junto con la disponibilidad equivalente, y emitir el producto con la unidad elegida.
11. En `FrontTienda`, actualizar `VentasPage` para identificar líneas por producto y unidad, permitir cantidades positivas de hasta dos decimales, calcular los totales con el precio de la presentación y enviar `unitId` al guardar o editar una venta pendiente.
12. En `FrontTienda`, actualizar `SaleCart` para mostrar y permitir cambiar la unidad de cada línea pendiente, recalcular el precio, disponibilidad, subtotal y total, y eliminar solo la línea de la presentación seleccionada.
13. En `FrontTienda`, cargar una venta pendiente sin consolidar sus detalles: cada detalle restaura su producto, unidad y cantidad original para permitir edición.
14. En `FrontTienda`, actualizar los diálogos y vistas de detalle e historial que muestran líneas de venta para incluir cantidad, nombre o abreviatura de unidad, factor y precio de presentación.
15. Añadir pruebas unitarias de los componentes y la página para selector, líneas por presentación, cantidad decimal, cambio de unidad, totales y restauración de una pendiente; verificar con `npm run build` y `npm test` en `FrontTienda`, y con `npm run build`, `npm run lint` y `npm test` en `ApiTienda`.

## Acceptance criteria

- [ ] Una migración nueva elimina todas las ventas, detalles, pagos y movimientos relacionados existentes antes de modificar el esquema de ventas.
- [ ] La migración nueva cambia `Product.stock` para conservar cuatro decimales y `SaleDetail.quantity` para conservar dos decimales.
- [ ] `GET /products` y `GET /products/:id` devuelven todas las unidades del producto base con id, nombre, abreviatura, factor e indicador principal.
- [ ] `POST /sales` y `PATCH /sales/:id` exigen `unitId` por cada detalle.
- [ ] Una venta rechaza una unidad inexistente o una unidad que no pertenece al producto base solicitado.
- [ ] Una cantidad menor o igual a cero, o con más de dos decimales, devuelve un error de validación.
- [ ] Una línea de caja x12 para un producto cuyo precio principal es 10 persiste `unitPrice: 120`.
- [ ] Una línea de 2.5 cajas x12 descuenta exactamente 30 unidades principales de stock.
- [ ] El API rechaza una venta cuando la suma convertida de todas sus líneas excede el stock del producto, incluso si las líneas usan unidades distintas.
- [ ] Dos líneas del mismo producto en unidad y caja se guardan y calculan como detalles independientes.
- [ ] Cada detalle de venta devuelve `unitId`, `unitName`, `unitValue`, `unitFactor`, `quantity`, `unitPrice` y `subtotal`.
- [ ] Editar el nombre, abreviatura o factor de una unidad no altera la presentación mostrada en una venta ya guardada.
- [ ] Pagar una venta descuenta el stock convertido dentro de la transacción y cancelar una venta pagada lo restaura con la misma precisión.
- [ ] El catálogo de ventas permite elegir cualquiera de las unidades configuradas antes de agregar un producto.
- [ ] El catálogo muestra el stock principal y la disponibilidad equivalente de la unidad seleccionada.
- [ ] Agregar el mismo producto con dos unidades distintas crea dos líneas de carrito.
- [ ] Agregar de nuevo el mismo producto con la misma unidad incrementa solo esa línea.
- [ ] El carrito admite cantidades positivas de hasta dos decimales.
- [ ] Cambiar la unidad de una línea pendiente recalcula su precio, disponibilidad, subtotal y total.
- [ ] Guardar o editar una pendiente envía `productId`, `unitId` y `quantity` de cada línea.
- [ ] Al editar una venta pendiente, sus líneas conservan producto, unidad y cantidad sin consolidarse entre sí.
- [ ] El detalle e historial de ventas muestran la presentación, cantidad y precio realmente vendidos.
- [ ] `npm run build` y `npm test` pasan en `FrontTienda`.
- [ ] `npm run build`, `npm run lint` y `npm test` pasan en `ApiTienda`.

## Decisions

- **Sí:** incluir API y frontend, porque el contrato actual no permite elegir una unidad de venta.
- **Sí:** permitir todas las unidades del producto base, incluida la principal, para no duplicar flujos de venta.
- **Sí:** calcular el precio de presentación multiplicando el precio principal por el factor.
- **Sí:** redondear el precio de presentación a dos decimales antes de multiplicarlo por la cantidad para conservar un importe cobrable y auditable.
- **Sí:** interpretar la cantidad como número de presentaciones elegidas; una caja x12 con cantidad 2 consume 24 unidades principales.
- **Sí:** permitir cantidades positivas con hasta dos decimales para vender presentaciones fraccionables.
- **Sí:** ampliar el stock a cuatro decimales para evitar pérdida de inventario al combinar factores y cantidades de dos decimales.
- **Sí:** permitir varias líneas del mismo producto si la unidad es distinta y consolidarlas solo para la validación de stock.
- **Sí:** elegir la unidad desde el catálogo y permitir cambiarla al editar el carrito de una venta pendiente.
- **Sí:** guardar instantáneas de nombre, abreviatura y factor de la unidad en cada detalle para preservar la auditoría histórica.
- **Sí:** eliminar las ventas existentes y sus dependencias en una migración nueva, porque el entorno está en desarrollo y no se debe preservar ese historial.
- **No:** agregar precios configurables por caja, paquete u otra presentación; requerirían un modelo de precios independiente.
- **No:** redondear la cantidad convertida a dos decimales; el stock a cuatro decimales conserva la conversión real.
- **No:** modificar migraciones históricas ni conservar ventas preexistentes.

## Risks

| Riesgo                                                                                           | Mitigación                                                                                              |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Una línea con factor y cantidad decimal puede agotar stock de forma imprecisa.                   | Usar `decimal(12,4)` para stock y cálculos decimales controlados en el servidor.                        |
| Dos presentaciones del mismo producto pueden superar el stock cuando se evalúan individualmente. | Consolidar `quantity * factor` por `productId` antes de validar y descontar.                            |
| Cambiar una unidad después de una venta puede alterar la interpretación histórica.               | Persistir nombre, abreviatura y factor como instantánea en `SaleDetail`.                                |
| La eliminación de ventas de desarrollo puede dejar referencias de pago o caja.                   | Borrar dependencias en orden seguro dentro de la migración y verificar la base de datos tras aplicarla. |
| El cliente puede manipular precio, factor o disponibilidad.                                      | El API ignora esos valores y resuelve unidad, factor, precio, stock y totales desde datos persistidos.  |

## What is **not** in this spec

- Precios especiales por presentación.
- Descuentos por línea o por unidad.
- Unidades o cantidades con más de dos decimales.
- Conservación de ventas existentes de desarrollo.
- Tickets, reportes, devoluciones, pagos mixtos o cambios al flujo de caja.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
