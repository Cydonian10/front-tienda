# SPEC 09 — Historial de inventario con datos de demostración

> **Status:** Borrador
> **Depends on:** SPEC 07
> **Date:** 2026-10-22
> **Objective:** Añadir al módulo de inventario un historial navegable de movimientos, con filtros y detalle, alimentado exclusivamente por datos ficticios locales.

## Why this spec exists

SPEC 07 registra movimientos reales, pero no ofrece un listado ni un detalle histórico. Esta especificación construye únicamente la interfaz solicitada a partir de una fixture local; no presenta esos ejemplos como registros de la API.

## Scope

**In:**

- Añadir «Historial» como entrada independiente de «Movimientos» en el grupo «Operaciones» y proteger su enlace, listado y detalle con `MOVIMIENTOS_LEER`.
- Crear `/admin/inventario/historial` con búsqueda por código, SKU, producto o almacén y filtro por tipo; mostrar entre 8 y 12 movimientos confirmados de ingreso, salida, traslado y ajuste, ordenados por fecha descendente.
- Crear `/admin/inventario/historial/:id` con datos del movimiento y variantes incluidas; permitir regresar al listado y mostrar «Movimiento no encontrado» para un ID ajeno a la fixture.
- Señalar «Datos de demostración» de forma visible en listado y detalle; conservar los temas `ferreteria` y `light` y el lenguaje visual de `DESIGN.md`, adaptando la estructura útil de la referencia sin copiar su identidad.
- Separar filtros, resultados y secciones de detalle en componentes locales pequeños con responsabilidades claras. Cubrir estados sin resultados, navegación, permisos y presentación adaptable a móvil con pruebas.

**Out of scope (for future specs):**

- Consulta de historial real en la API, mezcla de registros reales con la fixture o sincronización con los formularios de movimientos y Compras.
- Borradores, anulaciones, edición, eliminación, creación desde el historial y paginación.
- Nuevos permisos o cambios de backend.

## Data model

- `src/app/inventario/pages/historial/historial-demo.model.ts` define un tipo local de movimiento con `id`, `fecha`, `tipo: 'ingreso' | 'salida' | 'traslado' | 'ajuste'`, `estado: 'confirmado'`, `usuario`, `almacenOrigen`, `almacenDestino`, `motivo`, `valorCosto` y `detalles`. Cada detalle conserva `producto`, `sku`, `cantidad`, `unidad`, `factorABase`, `cantidadBase` y `costoAplicado` cuando corresponda al tipo. Los importes y cantidades decimales son cadenas.
- La fixture del mismo archivo contiene entre 8 y 12 ejemplos con IDs únicos, fechas fijas, datos coherentes con cada tipo y al menos una variante por movimiento. Los ajustes incluyen ejemplos positivos y negativos; el ingreso indica su procedencia en el motivo, sin inventar vínculos a compras reales.
- La búsqueda, el tipo seleccionado y el movimiento abierto se derivan de esa fixture. No hay `localStorage`, peticiones HTTP ni persistencia editable; recargar conserva los ejemplos originales.

## Implementation plan

1. Crear `src/app/inventario/pages/historial/historial-demo.model.ts` con tipos y fixture coherente; añadir pruebas de los datos y del filtrado/orden sin alterar los formularios actuales.
2. Incorporar la ruta del listado en `src/app/inventario/inventario.routes.ts` y la entrada «Historial» en `src/app/system-portal/services/control-access/system-menu.service.ts`, ambas con `MOVIMIENTOS_LEER`; actualizar sus pruebas y conservar la ruta «Movimientos».
3. Crear `src/app/inventario/pages/historial/historial-page.ts` y `.html`, más componentes locales en `components/` para filtros y resultados. Usar señales para búsqueda y tipo, incluir un estado vacío con opción de limpiar filtros y probar las combinaciones.
4. Incorporar la ruta `historial/:id` y crear `historial-detalle-page.ts` y `.html` con componentes locales para resumen y variantes. Cubrir ID válido, enlace de regreso e ID inexistente; no realizar peticiones ni enlazar compras de demostración con compras reales.
5. Completar pruebas de permisos, navegación, accesibilidad básica y comportamiento móvil y de ambos temas. Ejecutar las pruebas relevantes y `npm run build` sin cambiar las operaciones reales.

## Acceptance criteria

- [ ] Solo quien tiene `MOVIMIENTOS_LEER` en `INVENTARIO` ve «Historial» y puede abrir tanto `/admin/inventario/historial` como `/admin/inventario/historial/:id`.
- [ ] La entrada «Movimientos» sigue abriendo sus formularios; «Historial» abre el listado independiente.
- [ ] El listado muestra entre 8 y 12 registros confirmados de los cuatro tipos, ordenados por fecha descendente, sin solicitar datos a la API ni leer `localStorage`.
- [ ] La búsqueda encuentra coincidencias por código, SKU, producto y almacén; el filtro por tipo funciona conjuntamente con la búsqueda.
- [ ] Una combinación sin coincidencias muestra un estado vacío y permite restablecer los filtros; no aparece un filtro de estado sin alternativas reales.
- [ ] «Ver detalle» abre una URL por ID que funciona al recargar; un ID desconocido muestra «Movimiento no encontrado» y un enlace de regreso.
- [ ] El detalle presenta ID, fecha, tipo, usuario, almacenes según el tipo, motivo, valor a costo y variantes con cantidades, unidad, factor y costo aplicable.
- [ ] El aviso «Datos de demostración» es visible en ambas páginas; no se muestran vínculos a compras reales basados en datos ficticios.
- [ ] Los controles son accesibles por teclado y la tabla o su alternativa móvil se puede consultar sin desbordamiento horizontal de la página en móvil; el contenido respeta los temas `ferreteria` y `light`.
- [ ] Pasan las pruebas relevantes y `npm run build` en `front-tienda`.

## Decisions

- **Yes:** fixture local, tipada y estable; permite probar la interfaz sin atribuir los datos a la API.
- **Yes:** reutilizar `MOVIMIENTOS_LEER`; evita ampliar permisos o backend para una demostración.
- **Yes:** ruta propia de detalle por ID; permite recarga y enlace directo.
- **Yes:** adaptar filtros, tabla y detalle de la referencia a la identidad de Ferretería Atlas y a componentes locales, no copiar la estética de Nexo.
- **No:** filtro de estado, porque todos los ejemplos son confirmados; tampoco paginación para una fixture pequeña.
- **No:** conexión con movimientos reales, persistencia en navegador ni acciones de edición; requieren otra especificación.

## Risks

| Risk | Mitigation |
| --- | --- |
| El usuario interpreta los ejemplos como operaciones reales. | Mostrar «Datos de demostración» en listado y detalle, sin mezclar respuestas de la API ni ofrecer enlaces ficticios a compras reales. |
| El esquema ficticio se confunde con el contrato futuro del historial real. | Mantener tipos y fixture locales a `pages/historial/` y documentar explícitamente que la integración real está fuera de alcance. |

## What is **not** in this spec

- Ningún historial de la API ni sincronización con compras, existencias o nuevos movimientos.
- Ningún borrador, anulación, edición, eliminación, paginación ni permiso nuevo.
