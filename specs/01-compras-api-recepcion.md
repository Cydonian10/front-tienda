# SPEC 01 — API de compras y recepción de inventario

> **Status:** Implementado
> **Depends on:** None
> **Date:** 2026-10-17
> **Objective:** Registrar compras con comprobante opcional y confirmar su recepción inmediata en inventario mediante una API autorizada y transaccional.

## Why this spec exists

`api-tienda` ya contiene entidades de compras, detalles, comprobantes, movimientos y existencias, así como las tablas creadas en `src/database/migrations/1791690118249-inventario.ts`, pero no dispone de endpoints para comprar ni de lógica para confirmar ingresos. `docs/modelos/03-compras-inventario.md` describe un flujo futuro de recepciones parciales y contiene afirmaciones sobre migraciones que ya no reflejan el repositorio; este alcance implementa únicamente recepción completa e inmediata.

## Scope

**In:**

- Añadir a `api-tienda` consultas de proveedores paginadas por `page`/`limit` y filtradas por nombre y documento, más una consulta completa filtrable para selectores; no crear ni editar proveedores.
- Añadir búsqueda paginada de variantes activas por nombre del producto o SKU, con producto, unidad base y unidades de compra válidas con su factor de conversión.
- Registrar una compra con proveedor existente, almacén activo, tipo de comprobante (`factura`, `boleta`, `otro`), fecha, serie, número, observaciones opcionales y al menos un renglón; las variantes y productos deben estar activos.
- Confirmar la compra y un único movimiento `ingreso` vinculado, con un detalle de movimiento por renglón y actualización de cantidad y valor a costo por variante y almacén en una sola transacción de PostgreSQL.
- Listar compras paginadas, ordenadas por registro más reciente y buscables por nombre de proveedor o serie/número; consultar una compra con sus renglones, almacén, ingreso y metadatos del comprobante.
- Recibir opcionalmente un solo archivo PDF/JPG/PNG de hasta 10 MB en el envío de creación; guardar la compra y el ingreso aunque falle la validación o el almacenamiento del archivo, devolviendo una advertencia y el ID de la compra para reintentar el adjunto.
- Permitir adjuntar el único comprobante pendiente mediante un endpoint separado después de confirmar la compra; guardarlo en almacenamiento privado y permitir su descarga autenticada.
- Crear los permisos `COMPRAS_LEER`, `COMPRAS_CREAR` y `PROVEEDORES_LEER` del sistema `INVENTARIO`, sin asignarlos automáticamente a ningún rol; aplicar `COMPRAS_LEER` a la descarga, `PRODUCTOS_LEER` a la búsqueda de variantes y los permisos correspondientes a las otras operaciones.
- Añadir una migración para campos separados de tipo, serie y número de documento y para impedir duplicados por proveedor, tipo, serie y número; registrar los permisos en el mecanismo de catálogo/seed existente.

**Out of scope (for future specs):**

- Pantallas Angular, menú y formulario de compras; los cubre SPEC 02.
- Alta/edición de proveedores y página de proveedores.
- Borradores, recepción posterior o parcial, correcciones/anulaciones, pagos, descuentos, impuestos desglosados y movimientos manuales.
- Reemplazar un comprobante ya guardado o admitir múltiples archivos por compra.

## Data model

- `Compra` en `api-tienda/src/features/inventory/entities/compra.entity.ts`: conservar `fecha`, `totalDocumento` y `observaciones`; añadir `tipoDocumento: 'factura' | 'boleta' | 'otro'`, `serieDocumento: string` y conservar/usar `numeroDocumento: string` como número separado. Los tres datos documentales son obligatorios para las compras creadas por este flujo. Una migración añade las columnas y la unicidad `(proveedor_id, tipo_documento, serie_documento, numero_documento)` para filas con datos completos, sin invalidar registros anteriores incompletos.
- `DetalleCompra`: `varianteId`, `unidadId`, `cantidad`, `factorABase` copiado del catálogo y `precioUnitario`; cantidades, factores, precios, subtotales y costos se manejan como decimales exactos y se exponen como cadenas, no como `number` de coma flotante.
- `Compra.totalDocumento` es la suma de los subtotales `cantidad × precioUnitario` de sus renglones, expresada en PEN; cada subtotal y `DetalleMovimiento.costoTotal` se redondean a seis decimales con la regla mitad hacia arriba antes de sumar. La cantidad recibida en unidad base es `cantidad × factorABase`; si el resultado no se representa exactamente con seis decimales, se rechaza la compra, sin redondear stock. `Existencia.cantidad` y `Existencia.valorCosto` acumulan las cantidades base y costos respectivos. Se admiten renglones repetidos de una variante si su unidad o precio difiere.
- `MovimientoInventario`: `tipo = ingreso`, `estado = confirmado`, `compraId`, `proveedorId`, `almacenDestinoId`, `usuarioId` tomado de la sesión y un `DetalleMovimiento` por renglón enlazado a `DetalleCompra`; nunca aceptar `usuarioId`, factor de conversión ni costo aplicado como valores autoritativos enviados por el cliente.
- `ComprobanteCompra`: cero o un registro por compra en este flujo, con nombre original, MIME verificado, tamaño y clave privada. La ausencia de registro significa que el archivo puede adjuntarse más tarde; no se guarda un estado de fallo permanente. Usar almacenamiento privado independiente de imágenes públicas bajo `uploads/`, con ruta configurable, nombre aleatorio, lectura por ID autorizado y limpieza de archivos huérfanos ante errores; no exponer la clave como URL. Rechazar un segundo adjunto si ya existe uno, incluso ante subidas simultáneas.
- Contratos en `api-tienda/src/features/inventory/proveedores/`, `compras/` y la consulta de `variante-producto/`: `GET /api/proveedores` con `page`, `limit`, `nombre`, `documento`; `GET /api/proveedores/todos` con filtros opcionales; `GET /api/variantes` con búsqueda y paginación; `GET /api/compras` con `page`, `limit`, `q`; `GET /api/compras/:id`; `POST /api/compras` multipart con los datos de compra y el archivo opcional `comprobante`; `POST /api/compras/:id/comprobante` multipart solo con el archivo para un adjunto pendiente, protegido por `COMPRAS_CREAR`; `GET /api/compras/:id/comprobante/archivo` para descargarlo con `COMPRAS_LEER`. La creación responde HTTP 201 con el ID y `comprobante: { estado: 'adjuntado' | 'pendiente' | 'fallido', advertencia?: string }`: `pendiente` si no se envió archivo y `fallido` con advertencia si se intentó adjuntar sin éxito. El detalle informa si existe archivo y expone sus metadatos; el listado expone fecha, documento, proveedor, almacén y total.

## Implementation plan

1. Actualizar `compra.entity.ts`, el catálogo en `api-tienda/src/shared/authorization/permission-codes.ts` y `permission-definitions/inventario.ts`, y crear una migración incremental para los campos documentales y la unicidad; conservar funcionales los endpoints existentes y no conceder permisos a roles.
2. Incorporar consultas y controladores de solo lectura para proveedores y búsqueda de variantes en `api-tienda/src/features/inventory/`, con validación, autorización, DTO y pruebas; registrar los proveedores en `inventory.module.ts`.
3. Incorporar el almacenamiento privado de comprobantes con validación del contenido real, descarga controlada y pruebas de tipo, tamaño y acceso; no añadir todavía escrituras de compras.
4. Incorporar listado y consulta de compras con paginación, búsqueda, relaciones necesarias y permisos; verificar respuestas vacías y ausencia de recursos.
5. Incorporar el comando de compra e ingreso mediante `api-tienda/src/shared/database/unit-of-work.ts`: validar proveedor, almacén, variante, unidades y factores; calcular decimales en servidor; crear compra, renglones, movimiento confirmado, detalles y existencias dentro de la misma transacción.
6. Conectar la creación multipart: procesar los datos de compra independientemente del archivo para que un rechazo de tipo o tamaño del adjunto no aborte la operación completa; confirmar primero compra e ingreso en la transacción y después intentar guardar el comprobante. Ante fallo del archivo, responder HTTP 201 con `estado: 'fallido'`, advertencia e ID para reintentar, sin revertir la compra; limitar el tamaño recibido y limpiar archivos huérfanos si falla el registro de metadatos.
7. Añadir `POST /api/compras/:id/comprobante` para adjuntar posteriormente solo cuando todavía no existe comprobante, con autorización, protección ante intentos concurrentes y pruebas de reintento sin duplicar compra ni ingreso.
8. Completar pruebas de concurrencia, duplicado documental, permisos y rollback del ingreso; actualizar `api-tienda/docs/modelos/03-compras-inventario.md` para diferenciar este flujo inmediato del futuro flujo parcial y documentar contratos, advertencias y límites.

## Acceptance criteria

- [x] `GET /api/proveedores` filtra por nombre y documento con paginación, y `GET /api/proveedores/todos` devuelve todos los proveedores coincidentes sin paginar.
- [x] La búsqueda de variantes devuelve solo variantes activas de productos activos, con las unidades válidas del producto y su conversión; rechaza parámetros inválidos.
- [x] Con permiso `COMPRAS_CREAR`, una compra válida sin archivo crea exactamente una compra, un ingreso confirmado y sus detalles, y suma las cantidades y costos correctos a las existencias del almacén elegido.
- [x] Dos renglones de una variante con unidades o precios distintos conservan sus factores y costos individuales y actualizan correctamente la existencia conjunta.
- [x] Una cantidad base que requiera más de seis decimales se rechaza sin efectos; cada subtotal monetario se redondea mitad hacia arriba a seis decimales antes de sumar el total.
- [x] El servidor rechaza proveedor, almacén o variante inexistente/inactivo, unidad ajena al producto, cantidades/factores inválidos y precio negativo sin dejar cambios parciales.
- [x] Un documento con mismo proveedor, tipo, serie y número no puede confirmar dos compras, incluso ante solicitudes concurrentes.
- [x] Si falla la transacción de compra e ingreso, no quedan compra, movimiento ni stock alterado; si solo falla el comprobante seleccionado, se conserva una única compra con su ingreso confirmado y la respuesta HTTP 201 incluye ID, `estado: 'fallido'` y advertencia.
- [x] Si no se selecciona archivo, la compra se confirma con `estado: 'pendiente'`; si se adjunta correctamente, responde con `estado: 'adjuntado'`.
- [x] Un PDF, JPG o PNG real de hasta 10 MB se guarda privadamente y se descarga solo con sesión y `COMPRAS_LEER`; MIME falso, tipo distinto o tamaño mayor no se almacenan y, al crear una compra válida, se informa el fallo del adjunto sin revertir el inventario.
- [x] `POST /api/compras/:id/comprobante` permite a quien tiene `COMPRAS_CREAR` adjuntar el archivo pendiente tras un fallo inicial o una compra sin archivo, sin volver a crear compra o ingreso; un fallo de este endpoint deja la compra intacta y admite otro intento.
- [x] Una compra no admite un segundo comprobante cuando ya tiene uno, tampoco ante solicitudes simultáneas; la consulta muestra ausencia de archivo o sus metadatos según corresponda.
- [x] Las consultas de compras tienen paginación y búsqueda por proveedor/documento, muestran primero las recientes y el detalle incluye la referencia del ingreso y, si existe, metadatos del archivo.
- [x] `COMPRAS_LEER`, `COMPRAS_CREAR` y `PROVEEDORES_LEER` figuran en el catálogo de `INVENTARIO` sin asignación automática; usuarios sin el permiso exigido reciben denegación.
- [x] La migración se aplica sobre una base existente; `npm run build` y las pruebas específicas de handlers/controladores pasan en `api-tienda`.

## Decisions

- **Yes:** una compra equivale a una recepción completa y un ingreso confirmado; replica la acción de la referencia sin introducir borradores.
- **No:** entregas parciales o recepción diferida, aunque el modelo de datos pueda admitir varios ingresos; requieren un flujo propio.
- **Yes:** documento separado por tipo, serie y número, con unicidad por proveedor; evita perder información y duplicar stock.
- **Yes:** total y costo calculados en servidor a partir de renglones en PEN; no se acepta un total manual independiente en este alcance.
- **Yes:** rechazar conversiones a unidad base que no sean exactas a seis decimales y redondear cada subtotal monetario mitad hacia arriba a seis decimales; evita pérdidas silenciosas de stock y fija el costo aplicado.
- **Yes:** la compra y el ingreso tienen prioridad sobre el archivo opcional; el fallo del comprobante se informa como advertencia sin revertir la operación.
- **Yes:** intentar el comprobante en el mismo multipart y ofrecer un endpoint separado de adjunto posterior protegido por `COMPRAS_CREAR`; la descarga requiere `COMPRAS_LEER`.
- **No:** reemplazar un archivo existente ni exponer archivos en una carpeta pública.
- **No:** permisos heredados de productos para crear compras ni asignación automática de permisos nuevos a roles; cada administrador los asigna explícitamente.
- **Yes:** proveedores con listado paginado/filtrado y opción completa para el selector, sin CRUD ni pantalla dedicada.

## Risks

| Risk                                                                                   | Mitigation                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL y sistema de archivos no comparten una transacción.                         | Confirmar compra e ingreso primero, intentar el adjunto después, advertir si falla y limpiar archivos huérfanos si no se guardan metadatos.                     |
| Solicitudes repetidas o paralelas pueden duplicar stock.                               | Imponer unicidad documental en la base de datos y gestionar el conflicto como error de documento duplicado.                                                     |
| Actualizaciones simultáneas de una misma existencia pueden perder costos o cantidades. | Bloquear o actualizar atómicamente la fila `(variante_id, almacen_id)` dentro de la transacción y probar concurrencia.                                          |
| Los roles actuales no reciben permisos nuevos.                                         | Documentar la asignación manual de `COMPRAS_LEER`, `COMPRAS_CREAR`, `PROVEEDORES_LEER` y, para el formulario, los permisos de lectura de almacenes y productos. |

## What is **not** in this spec

- Ninguna interfaz Angular ni gestión de proveedores.
- Ningún borrador, recepción parcial/posterior, edición/anulación de compras ni reemplazo de un comprobante ya guardado.
- Ningún cálculo separado de impuestos, descuentos o pagos.
