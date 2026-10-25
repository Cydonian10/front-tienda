# SPEC 14 — API de proveedores e informe de compras

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-10-25
> **Objective:** Permitir crear proveedores y consultar su historial paginado de compras con un resumen monetario filtrable por fecha.

## Why this spec exists

La API ya lista proveedores para el formulario de compras, pero no permite registrarlos ni consultar sus compras agrupadas bajo un proveedor.

## Scope

**In:**

- Mantener `GET /api/proveedores` y `GET /api/proveedores/todos` con sus filtros actuales de nombre y documento.
- Añadir `POST /api/proveedores` para crear un proveedor con nombre obligatorio, documento y contacto opcionales.
- Añadir `GET /api/proveedores/:id/compras` para devolver identidad del proveedor, resumen y compras paginadas filtrables por `desde` y `hasta` sobre `Compra.fecha`.
- Exigir `PROVEEDORES_CREAR` para POST y `PROVEEDORES_LEER` junto con `COMPRAS_LEER` para el informe; registrar el permiso nuevo sin asignarlo automáticamente a roles.
- Ordenar las compras por fecha del documento descendente e ID descendente como desempate; incluir fecha, tipo, serie, número y monto del documento, todos nullable salvo fecha e ID.
- Contar todas las compras del intervalo; devolver un total monetario `null` si alguna carece de `totalDocumento`, `"0"` si no hay compras, o la suma decimal exacta cuando todas tienen monto.

**Out of scope (for future specs):**

- Pantalla Angular, productos que provee cada proveedor, renglones de compras y enlaces a compras.
- Edición, baja, desactivación, exportación o cambios en las compras existentes.
- Cambios en el esquema de base de datos y asignación automática de permisos a roles.

## Data model

- `api-tienda/src/features/inventory/proveedores/dto/crear-proveedor.dto.ts`: `CrearProveedorDto { nombre: string; documento?: string | null; contacto?: string | null }`. Recortar cadenas; nombre no vacío y de hasta 200 caracteres, documento hasta 100 y contacto hasta 200; convertir campos opcionales vacíos a `null`.
- `api-tienda/src/features/inventory/proveedores/dto/informe-compras-proveedor.dto.ts`: filtro `{ desde?: string; hasta?: string; page: number; limit: number }`; fechas calendario `YYYY-MM-DD` inclusivas, `page` desde 1, `limit` de 20 por defecto y máximo 100.
- En el mismo módulo, `InformeComprasProveedorDto { proveedor: ProveedorResponseDto; resumen: { cantidadCompras: number; totalDocumento: string | null }; data: CompraProveedorResumenDto[]; meta: PaginationMetaDto }`. `CompraProveedorResumenDto` contiene `id`, `fecha`, `tipoDocumento`, `serieDocumento`, `numeroDocumento` y `totalDocumento` con la misma nulabilidad que `Compra`.
- `api-tienda/src/shared/authorization/permission-codes.ts` y `permission-definitions/inventario.ts`: nuevo código `PROVEEDORES_CREAR`; los permisos de lectura existentes conservan su significado.
- Reutilizar `Proveedor` y `Compra` existentes; no persistir resúmenes ni introducir migraciones.

## Implementation plan

1. Registrar `PROVEEDORES_CREAR` en códigos y definiciones de permisos, sin modificar las asignaciones por rol; probar su registro y que no concede lectura ni escritura por sí solo.
2. Definir el DTO de alta y añadir el comando de creación bajo `api-tienda/src/features/inventory/proveedores/commands/crear-proveedor/`; validar longitudes, recortes y opcionales, y traducir documento duplicado a HTTP 409, incluida una carrera entre dos altas.
3. Exponer POST en `api-tienda/src/features/inventory/proveedores/controllers/proveedores/proveedores.controller.ts` y registrar el manejador en `inventory.module.ts`; probar respuesta con `ProveedorResponseDto` y autorización.
4. Definir filtro y respuesta del informe; añadir la consulta en `api-tienda/src/features/inventory/proveedores/queries/listar-compras-proveedor/`, con existencia previa del proveedor, rango inclusivo, orden estable, paginación y resumen calculado sobre todo el rango, no solo sobre la página.
5. Exponer GET `:id/compras` en el controlador, detrás de ambos permisos; probar 400 por UUID o fechas inválidos, 404 por proveedor inexistente, rangos invertidos, compras sin monto, intervalo vacío y combinaciones de permisos. Ejecutar pruebas relevantes y `npm run build` en `api-tienda`.

## Acceptance criteria

- [ ] Los dos GET existentes de proveedores conservan su contrato y requieren `PROVEEDORES_LEER`.
- [ ] POST con solo nombre válido crea un proveedor y devuelve `id`, `nombre`, `documento: null` y `contacto: null`; documento y contacto válidos se conservan recortados.
- [ ] Nombre vacío o campos que exceden las longitudes producen 400; un documento ya existente produce 409 sin crear duplicado, también ante altas concurrentes.
- [ ] POST requiere `PROVEEDORES_CREAR`; ningún rol recibe ese permiso automáticamente.
- [ ] GET `:id/compras` requiere simultáneamente `PROVEEDORES_LEER` y `COMPRAS_LEER` y devuelve 400 para ID inválido, 404 para proveedor inexistente.
- [ ] `desde` y `hasta` incluyen el día completo según `Compra.fecha`; un valor inválido o rango invertido devuelve 400.
- [ ] La lista devuelve hasta 20 compras por defecto, permite hasta 100, y ordena por `fecha DESC, id DESC`; `meta` informa el total de compras del intervalo.
- [ ] `resumen.cantidadCompras` cuenta todas las compras del intervalo y `resumen.totalDocumento` no depende de la página: vale `null` si algún monto falta, `"0"` si no hay compras y la suma decimal exacta en caso contrario.
- [ ] Pasan las pruebas de controlador, comando y consulta, y `npm run build` en `api-tienda`.

## Decisions

- **Sí:** separar contrato API (esta spec) de interfaz (SPEC 15); permite probar permisos y montos antes de presentarlos.
- **Sí:** `PROVEEDORES_CREAR` independiente y asignación manual; leer proveedores no autoriza crearlos.
- **Sí:** requerir también `COMPRAS_LEER` para el informe; sus importes no son información pública del catálogo.
- **Sí:** fechas del documento opcionales e inclusivas, sin rango predeterminado; el usuario ve el historial completo al entrar.
- **Sí:** total `null` ante un monto desconocido; evitar presentar una suma parcial como total del período.
- **No:** catálogo de productos suministrados ni renglones de compras; requerirían consultas y una interacción distintas.

## Risks

| Risk                                                                     | Mitigation                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Dos altas simultáneas con el mismo documento pasan la validación previa. | Usar la unicidad de la base de datos y traducir su conflicto a HTTP 409.                          |
| Sumar importes con aritmética binaria altera centavos o ignora nulos.    | Agregar con `numeric` en base de datos y probar montos decimales y nulos.                         |
| Paginar antes de agregar cambia el resumen según la página.              | Filtrar primero y calcular conteo y total del rango completo por separado de las filas paginadas. |

## What is **not** in this spec

- No se crea una página Angular ni un catálogo de productos por proveedor.
- No se editan o eliminan proveedores, ni se modifican compras o roles existentes.
