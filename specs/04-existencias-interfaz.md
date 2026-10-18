# SPEC 04 — Interfaz de existencias y valoración

> **Status:** Aprobado
> **Depends on:** SPEC 03
> **Date:** 2026-10-18
> **Objective:** Consultar desde el menú de Inventario el stock y su valoración por almacén, variante y unidad de medida sin modificar los saldos.

## Why this spec exists

La referencia `https://inventario-productos-gabriel.zudex85.chatgpt.site/` presenta una tabla de existencias por variante y almacén con filtros y costos, pero utiliza datos locales y mantiene un total global aunque se elija otro almacén. Esta interfaz usará la API de SPEC 03, exigirá elegir el alcance del almacén antes de consultar y seguirá `DESIGN.md` en vez de copiar la identidad visual de la referencia.

## Scope

**In:**

- Añadir `Operaciones → Existencias` al menú de `INVENTARIO` y la ruta protegida `/admin/inventario/existencias` mediante `EXISTENCIAS_LEER`; el mismo permiso basta para cargar el selector de almacenes.
- Al abrir la página, mostrar un selector sin selección inicial que obliga a elegir un almacén activo o «Todos los almacenes» antes de consultar saldos. Si no existen almacenes activos, explicar la situación sin disparar la consulta.
- Mostrar el valor del inventario a costo en PEN para la selección: un almacén muestra su propio total; «Todos los almacenes» muestra el total de todos los activos. Búsqueda, producto, disponibilidad y paginación no cambian esta cifra.
- Presentar una tabla paginada por variante y almacén, con producto, SKU/atributos, almacén, cantidad y unidad base, costo promedio por unidad base, valor del saldo y precio de venta de la variante claramente separado del costo.
- Ofrecer búsqueda por producto o SKU, selector de producto y disponibilidad (`Todas`, `Con stock`, `Sin stock`); incluir filas sin stock e identificar producto/variante inactivos que conservan saldo.
- Permitir elegir por fila una unidad secundaria válida del producto, manteniendo visible el stock exacto en unidad base. Mostrar unidades secundarias completas y resto exacto en unidad base; por ejemplo, 25 unidades base con factor 12 se muestran como `2 cajas + 1 unidad base`.
- Mostrar `—` para el costo promedio sin stock y una explicación neutral para stock positivo con costo registrado en cero. Respetar tema `ferreteria`/`light`, estados de carga, vacío, error con reintento, teclado y tamaños móviles.

**Out of scope (for future specs):**

- Crear o corregir existencias, introducir costo promedio, editar precio de venta, crear almacenes o añadir movimientos desde esta página.
- Precio de la última compra, margen/ganancia, valoración a precio de venta y descarga/exportación.
- Almacenes inactivos, persistencia de filtros entre sesiones y cambios al dashboard o a la página de prueba de productos.

## Data model

- Contratos en `src/app/api/interfaces/inventario/existencia.interface.ts` para opciones de almacén y respuesta paginada de SPEC 03: `items`, `page`, `limit`, `totalItems`, `totalValorCosto`; cada fila conserva los decimales recibidos como cadenas.
- Servicio `src/app/api/inventario/existencia-api.ts` para `GET /api/existencias/almacenes` y `GET /api/existencias`; consultas en `src/app/inventario/actions/use-existencias-action.ts` con claves estables para almacén, página, búsqueda, producto y disponibilidad. El total y las filas proceden de la API, no de señales locales ni de sumar la página.
- En `src/app/inventario/pages/existencias/`, señales locales para `almacenId: string | null`, `page`, `q`, `productoId`, `disponibilidad` y unidad seleccionada por fila. `null` significa «aún no elegido» y deshabilita la consulta; `todos` es una elección explícita. Al cambiar almacén o filtros de tabla, volver a la primera página.
- La conversión visual usa decimales exactos: `unidadesCompletas = parte entera inferior de cantidadBase / factorABase`; `restoBase = cantidadBase - unidadesCompletas × factorABase`. Un factor decimal o una cantidad base fraccionaria mantienen el resto decimal exacto. Elegir la unidad base muestra solamente `cantidadBase`; cambiar la presentación nunca altera el saldo persistido ni el total monetario.
- Mostrar `totalValorCosto` y el costo promedio por unidad base en PEN con dos decimales. El redondeo visual no reemplaza las cadenas exactas recibidas de la API.

## Implementation plan

1. Añadir `EXISTENCIAS_LEER` al contrato `src/app/api/interfaces/access-control/permision.interface.ts` y los tipos y servicio de la API de existencias; probar parámetros y respuestas.
2. Incorporar consultas TanStack Query para almacenes activos y filas paginadas; incluir todos los filtros en la clave y deshabilitar la consulta de saldos hasta elegir un almacén.
3. Añadir `Operaciones → Existencias` en `src/app/system-portal/services/control-access/system-menu.service.ts` y ruta protegida en `src/app/inventario/inventario.routes.ts`; probar visibilidad, acceso y usuarios que solo tienen `EXISTENCIAS_LEER`.
4. Construir `src/app/inventario/pages/existencias/existencias-page.ts` y `.html` con selector obligatorio, total del alcance seleccionado, tabla, paginación y estados sin datos o con error; aplicar los patrones visuales existentes.
5. Incorporar búsqueda y filtros opcionales con reinicio de página, manteniendo el total independiente de esos filtros y mostrando correctamente variantes inactivas con stock.
6. Añadir un control por fila para ver unidades secundarias completas más resto base, junto a la cantidad base exacta; probar conversiones enteras, factores decimales y saldos fraccionarios sin aritmética binaria imprecisa.
7. Completar pruebas de cambio de almacén, permiso, costo cero, costo no disponible, carga, errores y navegación móvil/teclado; verificar los temas `ferreteria` y `light`.

## Acceptance criteria

- [ ] Solo usuarios con `EXISTENCIAS_LEER` ven `Operaciones → Existencias` y pueden abrir `/admin/inventario/existencias`; no se exige `ALMACENES_LEER` para el selector.
- [ ] Al entrar no se elige ningún almacén automáticamente y no se solicita `/api/existencias` hasta elegir un almacén activo o «Todos los almacenes».
- [ ] Elegir un almacén muestra únicamente sus filas y su `totalValorCosto`; elegir «Todos» muestra una fila por variante/almacén activo y el total conjunto. No se muestran almacenes inactivos.
- [ ] Buscar por nombre/SKU, filtrar producto o disponibilidad y cambiar de página modifica el listado, pero no el valor del inventario mostrado para el almacén seleccionado.
- [ ] La tabla muestra stock cero de catálogo activo, identifica catálogo inactivo con stock y diferencia claramente el costo promedio por unidad base (PEN a dos decimales) del precio de venta, sin mostrar precio de última compra.
- [ ] Una fila con 25 unidades base y caja de factor 12 muestra `2 cajas + 1 unidad base` al seleccionarla; la cifra exacta `25 unidades base` permanece visible.
- [ ] Un factor o saldo base fraccionario presenta unidades completas y el resto exacto; cambiar de unidad no modifica ni valor monetario ni stock de la API.
- [ ] Sin stock se muestra `—` como costo promedio; stock positivo con `valorCosto = 0` muestra S/ 0 y aviso neutral sin afirmar que falta costo de apertura.
- [ ] Sin almacenes activos, sin filas para los filtros, carga y fallo de red son estados diferenciados; el fallo permite reintentar y no se sustituyen resultados por datos ficticios.
- [ ] La página usa datos y totales de la API, funciona por teclado y en móvil sin desbordamiento horizontal, respeta ambos temas, y `npm test -- --watch=false` y `npm run build` pasan en `front-tienda`.

## Decisions

- **Yes:** selector obligatorio sin valor inicial, incluso para «Todos»; evita consultar un alcance que el usuario aún no eligió.
- **Yes:** total por almacén o por todos los activos, independiente de filtros secundarios y paginación; corrige el comportamiento observado en la referencia.
- **Yes:** costo promedio calculado por la API y precio de venta del catálogo como cifras diferentes; el precio ingresado en una compra no es un campo editable en Existencias.
- **Yes:** unidades secundarias consultables por fila con enteros y resto, siempre junto al saldo base exacto; no expresar 25 unidades como solo 2 cajas.
- **Yes:** pantalla de solo lectura protegida por `EXISTENCIAS_LEER`, sin necesitar el permiso de gestión de almacenes.
- **No:** replicar la estética ni los datos locales de la referencia; respetar `DESIGN.md` y consultar PostgreSQL mediante SPEC 03.
- **No:** costo de última compra, revalorización manual ni persistencia de filtros; están fuera del objetivo de consulta.

## Risks

| Risk                                                                                  | Mitigation                                                                                                                     |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Una tabla con muchas filas o columnas se desborda en móvil.                           | Usar presentación adaptable y conservar etiquetas de unidad, importes y acciones accesibles; verificar móvil y teclado.        |
| Una conversión con factor decimal puede perder unidades por operaciones con `number`. | Operar con decimales exactos sobre cadenas, conservar saldo base visible y probar restos fraccionarios.                        |
| Costo promedio o totales pueden parecer inconsistentes al redondear la pantalla.      | Mostrar totales provistos por la API y diferenciar la precisión del promedio de los dos decimales monetarios de visualización. |

## What is **not** in this spec

- Ninguna mutación de inventario ni entrada manual de costo promedio.
- Ninguna consulta de almacenes inactivos, último precio de compra o valoración a precio de venta.
