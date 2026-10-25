# SPEC 15 — Interfaz de proveedores e informe de compras

> **Status:** Borrador
> **Depends on:** SPEC 02, SPEC 14
> **Date:** 2026-10-25
> **Objective:** Crear una página para listar y registrar proveedores y consultar en una página propia sus compras y resumen por fechas.

## Scope

**In:**

- Añadir «Proveedores» al menú Inventario y las rutas `/admin/inventario/proveedores` y `/admin/inventario/proveedores/:id`.
- Listar proveedores con búsqueda por nombre o documento, paginación y acción «Detalle» por fila; mantener filtros y página en la URL y restaurarlos al volver del detalle.
- Abrir «Crear proveedor» en un diálogo desde el listado, con nombre obligatorio, documento y contacto opcionales; mostrar errores de validación, conflicto de documento y confirmación de alta sin perder la tabla.
- Mostrar en el detalle la identidad del proveedor, filtros opcionales `desde`/`hasta`, cantidad de compras, total monetario y compras paginadas con fecha, comprobante y monto; sin enlace al detalle de Compras.
- Aplicar `PROVEEDORES_LEER` al listado, `PROVEEDORES_CREAR` a la acción de alta y `PROVEEDORES_LEER` junto con `COMPRAS_LEER` al informe, tanto en navegación como al ejecutar cada acción.
- Reutilizar la identidad de `DESIGN.md`, los componentes daisyUI y los patrones accesibles y responsivos de las páginas de Inventario en temas `ferreteria` y `light`.

**Out of scope (for future specs):**

- Cambios en `api-tienda` o en el modelo de proveedor y compra definido en SPEC 14.
- Productos que provee cada proveedor, detalle de renglones, enlaces a compras, exportación y gráficos.
- Editar, eliminar o desactivar proveedores; informes de movimientos de inventario.

## Data model

- `src/app/api/interfaces/inventario/proveedor.interface.ts`: `CrearProveedorDto { nombre: string; documento?: string | null; contacto?: string | null }`, `FiltroComprasProveedor { desde?: string; hasta?: string; page: number; limit: number }` y `InformeComprasProveedor` con `proveedor: ProveedorResponse`, `resumen: { cantidadCompras: number; totalDocumento: string | null }`, `data: CompraProveedorResumen[]` y `meta: PaginationMeta`. `CompraProveedorResumen` replica el resumen de SPEC 14; conservar importes como cadenas o `null`.
- `src/app/api/inventario/proveedor-api.ts`: ampliar el cliente existente con `create(dto)` y `listCompras(id, filtro)`; conservar `list` y `listAll` para Compras.
- `src/app/inventario/actions/use-proveedores-action.ts`: consultas TanStack Query para listado y compras por proveedor, y mutación de creación. Claves distintas para listado (nombre, documento, página y límite) e informe (ID, fechas, página y límite); invalidar únicamente listados de proveedores tras el alta.
- `src/app/api/interfaces/access-control/permision.interface.ts`: incorporar `PROVEEDORES_CREATE: 'PROVEEDORES_CREAR'`; usar los códigos existentes `PROVEEDORES_READ` y `COMPRAS_READ`.
- Las respuestas HTTP permanecen en TanStack Query; señales locales solo para campos del formulario, filtro visible, selección de fechas y estado de apertura del diálogo.

## Implementation plan

1. Añadir los contratos de SPEC 14, el nuevo código de permiso y los métodos `create` y `listCompras` al cliente `ProveedorApi`; probar parámetros, nulabilidad y respuestas HTTP sin romper el selector de proveedores de Compras.
2. Crear `use-proveedores-action.ts` con consultas y mutación; probar claves completas, bloqueo de consultas sin ID válido e invalidación selectiva tras crear.
3. Registrar en `src/app/inventario/inventario.routes.ts` las rutas de listado y detalle, y añadir «Proveedores» a la navegación de Inventario; probar visibilidad y guardas con los permisos adecuados.
4. Crear `src/app/inventario/pages/proveedores/proveedores-page.ts`, `.html` y pruebas: tabla en escritorio, presentación compacta en móvil, búsqueda por nombre/documento, paginación compartida, URL y estados de carga, vacío y error recuperable.
5. Incorporar un componente local de diálogo para crear en `pages/proveedores/components/`; validar, mantener los campos ante HTTP 409, preservar el foco al abrir/cerrar y refrescar el listado después de crear.
6. Crear `pages/proveedores/proveedor-detalle-page.ts`, `.html` y pruebas: carga del informe, fechas inclusivas, resumen, compras paginadas, tratamiento de total `null`, fechas inválidas, error/404 y regreso al listado filtrado.
7. Completar pruebas de permisos, URL compartida, ausencia de compras, conflicto de documento y navegación con teclado; ejecutar `npm test -- --watch=false` y `npm run build` en `front-tienda`, y verificar visualmente escritorio/móvil y ambos temas según `DESIGN.md`.

## Acceptance criteria

- [ ] «Proveedores» se muestra en Inventario solo a quien tenga `PROVEEDORES_LEER`; el listado no carga sin dicho permiso.
- [ ] El listado presenta proveedores reales, permite filtrar por nombre o documento, pagina a 20 inicialmente y muestra carga, vacío, ausencia de coincidencias y error con reintento.
- [ ] Los filtros y página del listado se reflejan en query params; recargar y volver del detalle preserva el contexto.
- [ ] «Crear proveedor» solo está disponible con `PROVEEDORES_CREAR`; una comprobación adicional impide ejecutar POST sin ese permiso aunque se invoque la acción directamente.
- [ ] El diálogo exige nombre; permite omitir documento y contacto; ante documento duplicado muestra el error junto al campo y conserva los valores, y tras un alta correcta se cierra y actualiza el listado sin recargar toda la página.
- [ ] El diálogo gestiona foco de entrada, Escape y retorno al disparador; controles y enlaces funcionan con teclado.
- [ ] El detalle solo carga con `PROVEEDORES_LEER` y `COMPRAS_LEER`; no muestra información de compras al faltar cualquiera de ellos.
- [ ] El informe inicia sin rango; acepta fechas `YYYY-MM-DD` inclusivas, conserva fechas y página en la URL, impide consultas con rango invertido y restablece la página a 1 al cambiar el filtro.
- [ ] El resumen cuenta todas las compras del intervalo, independientemente de la página; un total `null` se muestra como «No disponible» y no como S/ 0.00. Cada fila muestra fecha, comprobante y monto sin enlace a Compras.
- [ ] El detalle distingue sin compras, carga, proveedor inexistente y error recuperable; la paginación comienza en 20 y no duplica la lógica del componente compartido.
- [ ] La tabla y vista móvil no desbordan horizontalmente a 390 px, mantienen foco visible y se leen en `ferreteria` y `light`; pasan las pruebas relevantes, `npm test -- --watch=false` y `npm run build`.

## Decisions

- **Sí:** página de detalle en vez de modal o drawer; soporta filtros, paginación y URL compartible.
- **Sí:** alta en diálogo desde el listado, porque solo contiene tres campos y no requiere navegación aparte.
- **Sí:** consultar compras y su resumen; el catálogo derivado de productos queda para otra spec.
- **Sí:** totales incompletos como «No disponible» y número de compras separado; no inventar un importe cuando falta el monto de un documento.
- **Sí:** filtros en query params y regreso al contexto; no guardar estado de navegación en almacenamiento local.
- **No:** enlazar cada fila con la página de Compras ni expandir sus renglones; este informe es una consulta resumida.

## Risks

| Risk | Mitigation |
| --- | --- |
| Un usuario ve el botón de alta pero perdió el permiso al abrir la sesión. | Verificar permiso reactivo y otra vez antes de mutar; tratar el 403 de la API. |
| Los filtros y la paginación producen respuestas obsoletas durante la navegación. | Incluir ID y todos los filtros en las claves de consulta; conservar URL como origen navegable. |
| El informe contiene totales y fechas que no caben en móvil. | Presentar filas como fichas compactas, cifras tabulares y comprobar 390 px y ambos temas. |

## What is **not** in this spec

- Ningún cambio de API, edición o baja de proveedores.
- Ningún listado de productos suministrados, detalle de renglones ni enlace a la página de Compras.
