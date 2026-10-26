# SPEC 16 — API de mínimos de stock y resumen de reposición

> **Status:** Borrador
> **Depends on:** SPEC 01, SPEC 03, SPEC 07, SPEC 12
> **Date:** 2026-10-25
> **Objective:** Exponer mínimos configurables por variante y almacén y datos de stock, compras y salidas para un dashboard de reposición con permisos independientes.

## Why this spec exists

`Existencia` no tiene mínimo y puede no existir para un par variante–almacén con saldo cero. Además, una compra pendiente no tiene almacén persistido, de modo que sus estadísticas deben mostrarse como globales y no atribuirse al almacén seleccionado.

## Scope

**In:**

- Persistir un mínimo positivo en unidad base por variante y almacén, independiente de la existencia de una fila de saldo; permitir configurarlo y quitarlo mediante API.
- Devolver `minimoBase: string | null` en cada fila de `GET /api/existencias` y registrar `EXISTENCIAS_EDITAR_MINIMO` sin concederlo automáticamente a roles.
- Devolver para uno o todos los almacenes activos el número de pares variante–almacén con saldo positivo bajo o igual al mínimo, el número de pares agotados y las diez alertas más urgentes; no contar productos ni unidades secundarias como si fueran variantes.
- Devolver compras del período como documentos globales, incluidas las no recibidas, y salidas confirmadas del período para el almacén seleccionado; cada recurso tendrá sus propios permisos, conteo, cinco registros recientes y serie diaria de conteos.
- Ordenar de forma persistente los almacenes activos para poder seleccionar el primero creado por defecto en la interfaz; aplicar el mismo orden a `GET /api/existencias/almacenes` y `GET /api/movimientos/almacenes`. Para los almacenes ya existentes, reconstruir un orden inicial alfabético documentado porque su fecha histórica es desconocida.

**Out of scope (for future specs):**

- Dashboard Angular, edición visual de mínimos y navegación; pertenecen a SPEC 17.
- Ventas, importes agregados, pronósticos de compra, notificaciones automáticas y gráficos.
- Asignación automática del permiso nuevo a roles o almacenamiento de agregados precalculados.

## Data model

- `api-tienda/src/features/inventory/entities/minimo-existencia.entity.ts`: `MinimoExistencia { varianteId: string; almacenId: string; minimoBase: string }`, clave compuesta `(variante_id, almacen_id)`, referencias restrictivas a variante y almacén, `numeric(24, 6)` y restricción `minimo_base > 0`.
- `api-tienda/src/features/inventory/entities/almacen.entity.ts`: `ordenCreacion: string` (`bigint` único). La migración en `api-tienda/src/database/migrations/` asigna valores consecutivos a almacenes históricos ordenados por `nombre ASC, id ASC`; las nuevas altas obtienen el siguiente valor de una secuencia de base de datos. No presentar ese orden reconstruido como fecha histórica real.
- `api-tienda/src/features/inventory/existencias/dto/`: contrato de escritura `{ minimoBase: string }`, decimal positivo en unidad base con hasta 18 dígitos enteros y 6 decimales; la lectura de existencias añade `minimoBase: string | null` sin modificar cantidades ni valoraciones.
- `GET /api/existencias/resumen-reposicion?almacenId=<uuid|todos>` (`EXISTENCIAS_LEER`): `{ bajoMinimo: number; agotadas: number; alertas: { varianteId, productoNombre, sku, almacenId, almacenNombre, unidadBaseSimbolo, cantidadBase, minimoBase: string | null, tipo: 'agotada' | 'bajo_minimo' }[] }`. Los conteos abarcan todo el filtro, no solo las diez alertas. Se consideran variantes y productos activos en almacenes activos; un par sin saldo registrado tiene cantidad cero. `bajoMinimo` exige `0 < cantidadBase <= minimoBase`; `agotadas` exige `cantidadBase = 0` aunque no exista mínimo. Un mínimo ausente excluye solo de `bajoMinimo`. Las alertas se ordenan primero por agotadas, luego por bajo mínimo con menor proporción `cantidadBase/minimoBase`, después por `sku`, `almacenId` y `varianteId` ascendentes.
- `GET /api/compras/resumen-inventario?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` (`COMPRAS_LEER`): `{ total: number; porDia: { fecha: string; cantidad: number }[]; recientes: { id, fecha, proveedorNombre, tipoDocumento, serieDocumento, numeroDocumento, totalDocumento: string | null, recibida: boolean }[] }`. Cuenta documentos según `Compra.fecha`, independientemente de recepción o almacén; `recibida` indica si existe al menos un ingreso confirmado vinculado.
- `GET /api/movimientos/resumen-salidas?almacenId=<uuid|todos>&desde=YYYY-MM-DD&hasta=YYYY-MM-DD` (`MOVIMIENTOS_LEER`): `{ total: number; porDia: { fecha: string; cantidad: number }[]; recientes: { id, fecha, almacenOrigenId, almacenOrigenNombre, cantidadDetalles: number }[] }`. Cuenta movimientos confirmados de tipo `salida` según `MovimientoInventario.fecha` y `almacenOrigen`; excluye ingresos, traslados, ajustes, borradores y anulados.
- Los resúmenes de actividad aceptan fechas inclusivas `YYYY-MM-DD` en `America/Lima`; `porDia` incluye los días sin operaciones como cero. `recientes` se limita a cinco dentro del rango y ordena por fecha descendente e ID descendente. Los parámetros de fechas son obligatorios y un rango invertido o una fecha inexistente devuelve 400.
- `PUT /api/existencias/minimos/:varianteId/:almacenId` guarda o reemplaza el valor; `DELETE` en la misma ruta lo quita (idempotente); ambos exigen `EXISTENCIAS_EDITAR_MINIMO`. UUID inválido y mínimo inválido devuelven 400; variante o almacén inexistente/inactivo devuelve 404. Al quitarlo, la lectura devuelve `null` sin tocar el saldo.

## Implementation plan

1. Crear la migración y entidad de mínimos, añadir la columna/orden de creación de almacenes con secuencia y registrar las entidades en `api-tienda/src/features/inventory/inventory.module.ts`; comprobar claves, backfill estable, altas nuevas y que el stock permanece inalterado.
2. Registrar `EXISTENCIAS_EDITAR_MINIMO` en `api-tienda/src/shared/authorization/permission-codes.ts` y su definición de Inventario sin asignarlo a roles; probar que no concede lectura ni otros permisos.
3. Añadir DTO, comandos y `PUT`/`DELETE` a `api-tienda/src/features/inventory/existencias/controllers/existencias.controller.ts`; probar validación, permisos, configuración con saldo inexistente e idempotencia de borrado.
4. Ampliar la consulta y DTO de existencias con `minimoBase` y ordenar los listados de almacenes de Existencias y Movimientos por `ordenCreacion ASC`; probar valores nulos, paginación y respaldo de almacenes antiguos.
5. Añadir consulta, DTO y ruta `resumen-reposicion` bajo `api-tienda/src/features/inventory/existencias/`; probar conteos globales, almacén único, orden de las diez alertas y saldos cero sin fila.
6. Añadir consultas, DTO y rutas de resumen bajo `api-tienda/src/features/inventory/compras/` y `api-tienda/src/features/inventory/movimientos/`; probar permisos separados, fechas en Lima, ceros diarios, compras pendientes y filtro de salidas confirmadas.
7. Registrar los nuevos manejadores en `inventory.module.ts`, completar pruebas HTTP y de consultas; ejecutar `npm test` y `npm run build` en `api-tienda`.

## Acceptance criteria

- [ ] Un mínimo positivo se crea o reemplaza por par variante–almacén sin crear saldo; `DELETE` lo deja en `null` incluso si se repite, y nunca cambia `Existencia.cantidad`.
- [ ] La base rechaza mínimos cero, negativos y duplicados; la API rechaza más de seis decimales, UUID inválidos y entidades inexistentes/inactivas.
- [ ] Solo `EXISTENCIAS_EDITAR_MINIMO` autoriza PUT/DELETE y ningún rol lo recibe automáticamente; `EXISTENCIAS_LEER` sigue protegiendo lectura de saldos y resumen.
- [ ] `GET /api/existencias` añade `minimoBase` sin alterar los demás campos ni la paginación.
- [ ] `bajoMinimo` cuenta pares con saldo positivo `<= minimoBase`; `agotadas` cuenta pares activos de saldo cero con o sin mínimo; ambas cifras son independientes de las diez alertas.
- [ ] La lista de alertas tiene como máximo diez filas y orden estable; los pares sin mínimo y con saldo positivo no figuran como bajo mínimo.
- [ ] Los almacenes antiguos se ordenan inicialmente por nombre e ID; los nuevos conservan orden real de alta, y tanto el listado de Existencias como el de Movimientos entregan el primer almacén activo en el mismo orden.
- [ ] Compras exige `COMPRAS_LEER` y cuenta todos los documentos por fecha de compra, aunque aún no tengan ingreso; no recibe ni aplica filtro de almacén.
- [ ] Salidas exige `MOVIMIENTOS_LEER`, filtra por almacén origen cuando se indica y solo cuenta movimientos confirmados de tipo salida.
- [ ] Ambas series devuelven cada día del rango inclusive en `America/Lima`, con cero en días vacíos; los cinco recientes pertenecen al mismo rango y usan fecha/ID descendentes.
- [ ] Al faltar cualquiera de los tres permisos de lectura, solo se deniega su endpoint; los otros resúmenes siguen disponibles según sus permisos.
- [ ] Pasan `npm test` y `npm run build` en `api-tienda`.

## Decisions

- **Sí:** mínimo separado de `Existencia`; permite configurar y alertar pares de saldo cero nunca movidos.
- **Sí:** mínimo estrictamente positivo y borrado explícito; cero no expresa una alerta útil de reposición.
- **Sí:** compras globales incluso con almacén seleccionado; `Compra` no persiste almacén y excluir pendientes sería engañoso.
- **Sí:** contar operaciones por día, no sumar cantidades de unidades base incompatibles ni dinero con valores ausentes.
- **Sí:** tres rutas de lectura con permisos de dominio separados para permitir un dashboard parcial.
- **Sí:** orden persistente de almacenes; para registros históricos se usa el orden alfabético como respaldo y no se inventan fechas de creación.
- **No:** agregar estadísticas de ventas ni deducir almacén de una compra pendiente.

## Risks

| Risk | Mitigation |
| --- | --- |
| Generar combinaciones variante–almacén para saldos ausentes es costoso. | Agregar y limitar alertas en base de datos; medir consultas con un volumen representativo. |
| Compras globales y salidas por almacén parecen series del mismo alcance. | Identificar el alcance en cada respuesta y rotular explícitamente ambos en SPEC 17. |
| Un almacén antiguo pudo crearse antes que otro aunque su nombre ordene después. | Documentar el backfill alfabético; nunca presentarlo como fecha histórica. |
| Una operación alrededor de medianoche cae en otro día UTC. | Agrupar movimientos en `America/Lima` y probar los límites de fecha. |

## What is **not** in this spec

- No se crea interfaz ni se asigna el nuevo permiso a roles automáticamente.
- No se añaden ventas, alertas automáticas, métricas monetarias ni almacén persistido a las compras.
