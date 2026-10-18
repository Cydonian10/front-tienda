# SPEC 03 — API de existencias y valoración

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-18
> **Objective:** Consultar existencias y su valor a costo por variante y almacén activo mediante una API paginada, autorizada y basada en saldos reales.

## Why this spec exists

SPEC 01 actualiza `existencias.cantidad` y `existencias.valor_costo` al confirmar compras, pero todavía no existe una consulta de saldos y valoración. La referencia visual `https://inventario-productos-gabriel.zudex85.chatgpt.site/` usa datos locales y no modifica el total al filtrar almacenes; esta API usará PostgreSQL y devolverá el valor del almacén elegido o el de todos los almacenes activos.

## Scope

**In:**

- Añadir `EXISTENCIAS_LEER` al sistema `INVENTARIO` sin asignarlo automáticamente a ningún rol. Este permiso protege tanto la lista de almacenes seleccionables como los saldos, costos y precios consultados.
- Exponer `GET /api/existencias/almacenes` para listar todos los almacenes activos con `id` y `nombre`, sin requerir `ALMACENES_LEER` ni exponer el CRUD de almacenes.
- Exponer `GET /api/existencias` con `almacenId` obligatorio (`UUID` de almacén activo o `todos`), `page`, `limit` y filtros opcionales `q` (nombre de producto o SKU), `productoId` y `disponibilidad` (`todas`, `con_stock`, `sin_stock`).
- Devolver filas paginadas por variante y almacén con producto, SKU, atributos, unidad base, unidades secundarias válidas y factor a base, cantidad base, valor a costo, costo promedio por unidad base y precio de venta vigente de la variante.
- Incluir variantes y productos activos aunque no tengan fila en `existencias`, como saldo cero; incluir variantes o productos inactivos solo si conservan cantidad positiva, identificándolos como inactivos.
- Calcular `totalValorCosto` a partir de **todos** los saldos de los almacenes activos elegidos, incluidos los de productos/variantes inactivos con stock. Los filtros de tabla y la paginación no modifican ese total.
- Devolver `valorCosto = 0`, `costoPromedioBase = null` si la cantidad es cero; con cantidad positiva y valor cero, devolver costo promedio cero y una marca neutral `costoRegistradoCero` para que la vista advierta sin atribuir una causa.

**Out of scope (for future specs):**

- Menú y pantalla Angular; pertenecen a SPEC 04.
- Editar existencias, introducir costo promedio manual, abrir/revalorizar saldos anteriores o distinguir mediante nuevos metadatos una entrada gratuita de una apertura sin costo cargado.
- Precios de última compra, historial de costos, traslados, salidas, ajustes y almacenes inactivos.
- Valorización a precio de venta, utilidad potencial e impuestos.

## Data model

- No se añaden columnas ni tablas de existencias: se reutilizan `Existencia.cantidad` y `Existencia.valorCosto` de `api-tienda/src/features/inventory/entities/existencia.entity.ts`, `VarianteProducto.precio` para venta y las unidades de `UnidadProducto.factorABase`. Los importes y cantidades decimales se transmiten como cadenas.
- `GET /api/existencias/almacenes` devuelve `{ id: string, nombre: string }[]` para almacenes con `activo = true`. Es una lista de selección, no el endpoint de administración.
- `GET /api/existencias?almacenId=<uuid|todos>&page=1&limit=20&q=&productoId=&disponibilidad=todas` devuelve `{ items: ExistenciaConsulta[], page: number, limit: number, totalItems: number, totalValorCosto: string }`. `ExistenciaConsulta` contiene `producto: { id, nombre, activo, unidadBase: { id, nombre, simbolo } }`, `variante: { id, sku, activo, precioVenta: string, valores }`, `almacen: { id, nombre }`, `cantidadBase: string`, `valorCosto: string`, `costoPromedioBase: string | null`, `costoRegistradoCero: boolean` y `unidadesSecundarias: { id, nombre, simbolo, factorABase: string }[]` propias del producto. La unidad base no se repite entre las secundarias.
- `costoPromedioBase = valorCosto / cantidadBase` cuando `cantidadBase > 0`, representado con hasta seis decimales mediante aritmética decimal y redondeo mitad hacia arriba. El total se suma desde `valorCosto` a seis decimales **sin** reconstruirlo multiplicando el promedio redondeado. El precio de venta no participa en este cálculo.
- Los filtros de `q`, `productoId` y `disponibilidad` afectan `items` y `totalItems`, nunca `totalValorCosto`; un `almacenId` concreto afecta ambos. Para `todos`, cada combinación variante/almacén activo es una fila independiente. La paginación usa orden estable por producto, SKU, ID de variante e ID de almacén.
- Si no hay almacenes activos, el selector devuelve `[]`; la consulta con `todos` devuelve lista vacía y `totalValorCosto = '0'`. Un UUID inexistente o inactivo se rechaza; `almacenId` ausente y parámetros inválidos también se rechazan. No se usa un almacén predeterminado implícito.

## Implementation plan

1. Registrar `EXISTENCIAS_LEER` en `api-tienda/src/shared/authorization/permission-codes.ts` y `permission-definitions/inventario.ts`; añadir pruebas del catálogo sin asignarlo a roles.
2. Crear `api-tienda/src/features/inventory/existencias/` con un controlador protegido y la consulta de almacenes activos; registrar controlador y proveedores en `inventory.module.ts`, y probar el permiso independiente de `ALMACENES_LEER`.
3. Incorporar el contrato validado de `GET /api/existencias` con `almacenId` obligatorio y paginación/filtros; probar rechazo de almacenes inactivos, UUID inexistentes y parámetros inválidos.
4. Añadir la consulta paginada de saldos por variante y almacén, incluyendo cero solo para catálogo activo y saldos positivos de catálogo inactivo; devolver precio de venta y unidades válidas sin consultas individuales por fila.
5. Añadir cálculo decimal de costo promedio por fila y agregación independiente de `totalValorCosto` por almacén activo seleccionado; cubrir en pruebas compras con distintos precios, saldos cero, valor cero, múltiples almacenes, filtros y páginas.
6. Documentar el contrato y la semántica de valoración en `api-tienda/docs/modelos/02-inventario-costos.md`, aclarando que la confirmación de compras de SPEC 01 ya está implementada y que los demás movimientos siguen fuera de este alcance.

## Acceptance criteria

- [ ] `EXISTENCIAS_LEER` aparece en el catálogo `INVENTARIO` sin asignarse automáticamente; ambas consultas rechazan usuarios sin ese permiso.
- [ ] Un usuario con `EXISTENCIAS_LEER` y sin `ALMACENES_LEER` obtiene la lista completa de almacenes activos y consulta saldos; no accede por ello al CRUD de almacenes.
- [ ] Falta de `almacenId`, identificador inválido/inexistente/inactivo o filtros/paginación inválidos producen error de validación o recurso no disponible, sin consultar otros saldos.
- [ ] Con un almacén elegido, `totalValorCosto` suma todos sus saldos; con `todos`, suma todos los almacenes activos, pero ninguno inactivo.
- [ ] Búsqueda, filtro de producto, disponibilidad y cambio de página afectan las filas visibles y `totalItems`, pero no alteran `totalValorCosto` del almacén o conjunto seleccionado.
- [ ] Una variante activa sin fila persistida aparece con saldo y valor cero; una inactiva con cantidad positiva aparece marcada como inactiva y se incluye en el total; una inactiva sin stock no aparece.
- [ ] Para 10 unidades y valor S/ 50 más una compra de 10 unidades por S/ 70, la fila refleja 20 unidades, valor S/ 120 y promedio S/ 6 por unidad base, sin usar el precio de venta.
- [ ] Cantidad cero devuelve promedio `null`; cantidad positiva con valor cero devuelve promedio cero y `costoRegistradoCero = true`, sin afirmar si se trata de una compra gratuita o una apertura pendiente.
- [ ] Los importes, factores y cantidades se entregan como cadenas decimales; la suma del valor no pierde precisión por paginación, redondeo del promedio ni operaciones de coma flotante.
- [ ] La API devuelve unidad base, unidades secundarias válidas y factores por producto, y `npm run build` y las pruebas específicas pasan en `api-tienda`.

## Decisions

- **Yes:** costo promedio ponderado móvil calculado como valor del saldo dividido entre cantidad base, por variante y almacén; no se introduce manualmente en Existencias.
- **Yes:** `totalValorCosto` por selección de almacén, independiente de los demás filtros y de la página; la tabla sigue la selección y ofrece filas por variante/almacén.
- **Yes:** `todos` abarca solo almacenes activos, pero incluye saldos positivos de catálogo inactivo dentro de ellos; evita ocultar capital que todavía está físicamente registrado.
- **Yes:** permisos específicos `EXISTENCIAS_LEER` y selector disponible con ese mismo permiso; no exigir acceso administrativo a almacenes.
- **Yes:** costo registrado en cero se comunica sin afirmar su origen; el esquema actual no distingue costo gratuito de falta de apertura.
- **No:** costo de la última compra como sustituto del promedio o precio de venta como valoración del stock; representan conceptos distintos.
- **No:** devolver todos los registros para filtrar en el navegador; consulta paginada con agregación de total en servidor.

## Risks

| Risk                                                                                | Mitigation                                                                                                                             |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Un saldo anterior puede tener cantidad positiva y costo cero por causas distintas.  | Exponer el cero real y una marca neutral; no estimar valor a partir del precio de venta ni de compras posteriores.                     |
| La multiplicación de variantes por almacenes activos genera muchas filas sin saldo. | Paginar y filtrar en SQL con orden estable; calcular el total desde saldos persistidos sin materializar todo el producto cartesiano.   |
| Una compra concurrente puede cambiar saldos entre consultas.                        | Mantener consultas de filas y total coherentes dentro de la petición cuando sea necesario; no calcular el total a partir de la página. |

## What is **not** in this spec

- Ninguna pantalla Angular, edición de stock ni apertura/revalorización de saldos.
- Ningún precio de última compra, cálculo de utilidad ni consulta de almacenes inactivos.
