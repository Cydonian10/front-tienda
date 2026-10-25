# SPEC 12 — API de historial de movimientos de inventario

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 07, SPEC 09
> **Date:** 2026-10-24
> **Objective:** Exponer un listado paginado y un detalle de movimientos confirmados para que la pantalla de historial pueda consultar operaciones reales.

## Why this spec exists

La pantalla de historial muestra datos de demostración. `api-tienda` registra ingresos por compras, salidas, traslados y ajustes, pero no ofrece consultas para listarlos ni abrir su detalle.

## Scope

**In:**

- Añadir `GET /api/movimientos` y `GET /api/movimientos/:id`, ambos protegidos con `MOVIMIENTOS_LEER` de INVENTARIO.
- Listar únicamente movimientos confirmados de los cuatro tipos, ordenados por fecha descendente e ID como desempate.
- Filtrar el listado por tipo, texto y fechas `desde`/`hasta`. La búsqueda textual cubre fragmentos del UUID, SKU, producto y almacenes; ignora mayúsculas y tildes.
- Paginar con `page` desde 1 y `limit` de 20 por defecto, máximo 100. Devolver resúmenes en el listado y líneas completas solo en el detalle.
- Interpretar las fechas `YYYY-MM-DD` como días inclusivos de `America/Lima`. Rechazar filtros inválidos y rangos invertidos.

**Out of scope (for future specs):**

- Conectar Angular a estos endpoints, sustituir la fixture y aplicar `debounced` a la señal de búsqueda. La [API `debounced` de Angular](https://angular.dev/guide/signals/debounced) es experimental; su adopción corresponde a la spec de interfaz.
- Crear códigos `MOV-...`, guardar copias históricas de nombres o añadir migraciones.
- Crear, editar o anular movimientos desde el historial.

## Data model

- `api-tienda/src/features/inventory/movimientos/dto/filter-historial-movimientos.dto.ts`: filtro con `q?` recortado de 2 a 200 caracteres, `tipo?` (`ingreso | salida | traslado | ajuste`), `desde?`, `hasta?`, `page` y `limit`.
- `api-tienda/src/features/inventory/movimientos/dto/historial-movimiento-response.dto.ts`: resumen `{ id, fecha, tipo, estado: 'confirmado', almacenOrigen: string | null, almacenDestino: string | null, cantidadDetalles: number, valorCosto: string | null }`. El listado usa la respuesta existente `{ data, meta: { page, limit, total, totalPages } }`.
- El detalle añade `usuario` como `nickName`, `compraId: string | null`, `motivo: string | null` y `detalles`. Cada línea contiene `id`, `producto`, `sku`, `cantidad`, `unidad`, `factorABase`, `cantidadBase`, `costoTotal: string | null` y `costoAplicado: string | null`.
- `valorCosto` suma los `costoTotal` de las líneas como decimal; es `null` si falta el costo de cualquiera de ellas. `costoAplicado` es `costoTotal / abs(cantidadBase)`, expresado como cadena con seis decimales y redondeo mitad hacia arriba; es `null` si falta el costo. Los nombres se leen de las entidades relacionadas en su estado actual, no como instantáneas históricas.

## Implementation plan

1. Añadir el filtro y los DTO de respuesta en `api-tienda/src/features/inventory/movimientos/dto/`, con pruebas de validación, fechas y cálculos decimales.
2. Añadir `api-tienda/src/features/inventory/movimientos/queries/listar-historial-movimientos/` con consulta paginada, filtros combinables, búsqueda sin distinción de tildes ni mayúsculas y conteo correcto sin duplicados por líneas.
3. Añadir `api-tienda/src/features/inventory/movimientos/queries/obtener-historial-movimiento/` para cargar un movimiento confirmado por UUID y sus relaciones, sin consultas por cada línea.
4. Incorporar ambos GET en `api-tienda/src/features/inventory/movimientos/controllers/movimientos.controller.ts` y registrar los manejadores y repositorios necesarios en `api-tienda/src/features/inventory/inventory.module.ts`. Probar autorización, respuestas y errores HTTP.
5. Completar pruebas de los cuatro tipos, ingresos asociados a compras, costos nulos, orden y límites de página. Ejecutar las pruebas relevantes y `npm run build` en `api-tienda`.

## Acceptance criteria

- [ ] Ambos GET exigen `MOVIMIENTOS_LEER` de INVENTARIO; sin él se deniega la consulta.
- [ ] El listado incluye ingresos, salidas, traslados y ajustes confirmados, pero excluye borradores y anulados.
- [ ] `q` encuentra fragmentos de UUID, SKU, producto y cualquiera de los almacenes, sin distinguir mayúsculas ni tildes; un `q` de un carácter se rechaza.
- [ ] Tipo, texto y fechas se combinan; `desde` y `hasta` incluyen íntegramente los días indicados en `America/Lima`, y un rango invertido se rechaza.
- [ ] La respuesta pagina 20 elementos por defecto, acepta `limit` hasta 100 y mantiene el orden fecha descendente/ID descendente aun cuando varios movimientos compartan fecha.
- [ ] El listado devuelve resúmenes sin líneas; el detalle devuelve usuario, `compraId` nullable y todas las líneas con cantidades y costos como cadenas decimales.
- [ ] Si falta el costo de una línea, su `costoAplicado` y el `valorCosto` del movimiento son `null`, nunca un cero ni una suma incompleta.
- [ ] Un UUID válido inexistente devuelve 404; un ID con formato inválido devuelve 400.
- [ ] Las consultas no modifican existencias ni movimientos; pasan las pruebas relevantes y `npm run build` en `api-tienda`.

## Decisions

- **Sí:** API y conexión Angular en specs separadas; esta entrega define el contrato que consumirá la pantalla.
- **Sí:** UUID parcial en la búsqueda; no introducir un código legible ni una migración para crearlo.
- **Sí:** resúmenes paginados y detalle por ID; evitar transferir todas las líneas en cada página.
- **Sí:** nombres actuales y costos derivados de `costoTotal`; no duplicar datos históricos.
- **No:** aplicar `debounced` en esta spec, porque pertenece a Angular y la pantalla seguirá usando la fixture hasta la integración posterior.

## Risks

| Risk                                                                 | Mitigation                                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Los nombres actuales cambian después de confirmar un movimiento.     | Documentar que solo cantidades, factores y costos persistidos representan los valores históricos.          |
| Las uniones con detalles duplican filas o alteran el total paginado. | Paginar movimientos antes de cargar relaciones y probar conteo y orden con movimientos de varias líneas.   |
| Una búsqueda textual amplia resulta costosa.                         | Mantener paginación y medir las consultas con datos representativos antes de añadir índices o migraciones. |

## What is **not** in this spec

- Ningún cambio en `front-tienda`, incluido el debounce de Angular.
- Ninguna escritura, anulación, instantánea de nombres ni código nuevo de movimiento.
