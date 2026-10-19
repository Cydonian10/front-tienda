# SPEC 06 — Interfaz móvil para gestionar productos existentes

> **Status:** Borrador
> **Depends on:** SPEC 05
> **Date:** 2026-10-18
> **Objective:** Buscar y gestionar productos existentes y sus variantes desde una pantalla adaptable que guarde los cambios en la API.

## Why this spec exists

En `src/app/inventario/pages/productos/productos-page.ts`, el botón «Gestionar producto existente» cambia un modo pero no presenta una vista. La referencia `https://inventario-productos-gabriel.zudex85.chatgpt.site/` muestra galería, variantes y selector, pero guarda datos localmente y en móvil obliga a desplazar horizontalmente la tabla. Esta página conservará el lenguaje visual de `DESIGN.md` y utilizará la API de SPEC 05.

## Scope

**In:**

- Añadir la ruta protegida `/admin/inventario/productos/gestion`, accesible con `PRODUCTOS_LEER`; el botón «Gestionar producto existente» de la página de creación navega a esa ruta y permite volver sin alterar el asistente actual.
- Iniciar sin producto seleccionado. Un `?productoId=<uuid>` válido abre ese producto directamente en gestión; un ID inexistente o inaccesible muestra error con opción de volver al selector. La ruta existente `/admin/inventario/productos?productoId=...` conserva el comportamiento de creación actual.
- Ofrecer un selector con búsqueda remota paginada por **nombre**: pedir sugerencias a partir de dos caracteres, mostrar 20 por página y «Cargar más», señalar productos inactivos, permitir selección por teclado y ratón, y diferenciar carga, ningún resultado y error con reintento.
- Al seleccionar producto, presentar un panel por secciones con resumen, datos generales/galería del producto y variantes existentes. Permitir editar nombre, descripción, unidad base cuando `puedeCambiarUnidadBase` sea `true`, activo y fotos mediante el PATCH existente; explicar el bloqueo de unidad base si hay saldos o movimientos.
- Mostrar para cada variante SKU y valores de atributos en solo lectura. Permitir editar precio, código de barras, estado y fotos propias, con «Guardar variante» independiente; permitir también añadir una variante con el flujo de creación existente, incluidos SKU, atributos y fotos al crearla.
- Mostrar fotos heredadas del producto como solo lectura cuando la variante no tenga fotos propias; permitir agregar o quitar fotos propias con el límite de 10, sin ofrecer borrar las heredadas ni ordenar fotos.
- Mantener lectura para quien tiene `PRODUCTOS_LEER` sin `PRODUCTOS_EDITAR`; esconder/deshabilitar acciones de escritura y comprobar el permiso también antes de ejecutar cada mutación. Reflejar errores de API sin perder cambios del formulario y confirmar el descarte antes de cambiar de producto o salir con cambios sin guardar.
- Usar datos de servidor con TanStack Query, invalidación acotada tras guardar y estado local con señales. En móvil, apilar secciones y usar tarjetas editables para variantes sin desplazamiento horizontal de la página; soportar teclado, `ferreteria` y `light`.

**Out of scope (for future specs):**

- Edición de SKU o valores de atributos de variantes existentes, alta de atributos desde gestión, edición de unidades secundarias y cambios de existencias.
- Galería/biblioteca compartida de la demo, edición manual de portada u orden de fotos, guardar borradores en navegador y estética o datos locales de la referencia.
- Rediseñar el asistente de creación, reemplazar el menú lateral o modificar las páginas de compras/existencias.

## Data model

- Contrato de búsqueda en `src/app/api/interfaces/inventario/producto.interface.ts`: `ProductoSeleccion = { id: string; nombre: string; activo: boolean }` y `ProductosPagina = { items: ProductoSeleccion[]; page: number; limit: number; totalItems: number }`. `ProductResponse` añade `puedeCambiarUnidadBase: boolean`, procedente de la API, no inferido de la pantalla.
- `src/app/api/interfaces/inventario/variante.interface.ts` añade `UpdateVarianteDto` con `precio?`, `codigoBarras?`, `activo?`, `imagenesConservarIds?` e `imagenes?`; las imágenes efectivas para previsualización incluyen `origen: 'producto' | 'variante'` desde el endpoint existente. Solo se envían IDs de asociaciones propias para conservar fotos.
- `ProductoApi` añade `search({ q, page, limit })`; `VarianteApi` añade `update(productoId, varianteId, dto)` y la lectura de la galería efectiva/archivos de variante. Las consultas/mutaciones residen en `src/app/inventario/actions/`; la clave de búsqueda contiene término y página, y las claves de detalle contienen ID de producto/variante. Los modelos simulados de las pruebas de creación se adaptan al nuevo campo de respuesta.
- En `src/app/inventario/pages/productos/gestion-productos-page.ts` las señales locales representan texto buscado, producto seleccionado, páginas solicitadas y estado de formularios sin guardar. Ninguna búsqueda, selección ni edición pendiente persiste entre sesiones; solo `productoId` en la URL identifica un producto al abrir un enlace.

## Implementation plan

1. Extender contratos y métodos HTTP de productos/variantes en `src/app/api/interfaces/inventario/`, `src/app/api/inventario/product-api.ts` y `variante-api.ts`; probar parámetros, multipart y errores de la API de SPEC 05.
2. Incorporar consultas de búsqueda/detalle e imagen y mutaciones de actualización en `src/app/inventario/actions/` con claves estables e invalidación selectiva; mantener la creación existente funcional.
3. Registrar `/admin/inventario/productos/gestion` en `src/app/inventario/inventario.routes.ts` y conectar el botón de `productos-header`/`productos-page.ts` con navegación real, conservando la ruta y enlaces existentes del asistente.
4. Crear `src/app/inventario/pages/productos/gestion-productos-page.ts`, `.html` y pruebas, más un componente local de selector buscable; cubrir selección vacía, enlaces por ID, carga, sin resultados, error y productos inactivos.
5. Reutilizar/adaptar `datos-generales-step` en el panel de gestión para actualizar datos y fotos con permiso reactivo; mostrar `puedeCambiarUnidadBase`, error del servidor y confirmación de descarte sin habilitar guardado a solo lectura.
6. Crear un componente local de tarjeta de variante para edición de precio, código, estado y galería propia; incluir el alta existente de variantes, las fotos heredadas de solo lectura y la actualización atómica por variante.
7. Adaptar panel y tarjetas a móvil y ambos temas con `DESIGN.md`; probar teclado, foco, confirmación de descarte, permiso, fallos sin perder borradores y vistas sin desbordamiento horizontal.

## Acceptance criteria

- [ ] El botón «Gestionar producto existente» abre `/admin/inventario/productos/gestion`; el asistente de creación y sus enlaces `?productoId=...` siguen funcionando igual.
- [ ] La ruta de gestión sin `productoId` muestra selector vacío; un enlace con UUID válido selecciona ese producto y uno inválido muestra error y permite buscar otro.
- [ ] Buscar por nombre con menos de dos caracteres no dispara la consulta; desde dos caracteres se muestran hasta 20 resultados por página, se pueden cargar más, aparecen inactivos señalados y no se filtra solo la primera página en el cliente.
- [ ] Selector y detalle diferencian carga, sin resultados, fallo recuperable y producto seleccionado; búsqueda y selección se pueden usar con teclado.
- [ ] Con `PRODUCTOS_EDITAR`, se guardan datos generales, activo y hasta ocho imágenes del producto mediante el PATCH existente; cambiar una unidad base bloqueada está deshabilitado y explicado, y un rechazo del servidor conserva el formulario.
- [ ] Cada variante existente muestra SKU/atributos no editables y permite guardar precio, código anulable, estado y fotos propias con un botón independiente; un fallo no confirma ni pierde los cambios pendientes.
- [ ] Al crear una variante desde gestión se usan los atributos existentes y se actualizan solo las consultas del producto afectado; no se puede cambiar SKU ni valores de atributos de variantes ya creadas.
- [ ] Las fotos heredadas están identificadas y no ofrecen «Quitar»; añadir fotos propias reemplaza su visualización, quitar la última propia vuelve a mostrar la galería del producto y el límite de diez se respeta.
- [ ] Con solo `PRODUCTOS_LEER` se puede consultar y seleccionar, pero no ejecutar actualizaciones ni altas aunque se invoque el manejador sin usar los botones.
- [ ] Cambiar de producto o salir con cambios locales muestra confirmación; cancelar conserva selección/formularios y aceptar descarta únicamente cambios no guardados. No se restaura búsqueda o borrador tras una nueva sesión.
- [ ] A 390 px y en escritorio, formulario y variantes se usan sin desbordamiento horizontal de la página; foco y controles son accesibles, temas `ferreteria`/`light` funcionan, y `npm test -- --watch=false` y `npm run build` pasan en `front-tienda`.

## Decisions

- **Yes:** ruta separada `/admin/inventario/productos/gestion?productoId=...`; no cambiar el significado del parámetro en la ruta del asistente.
- **Yes:** búsqueda remota paginada solo por nombre, desde dos caracteres, con 20 sugerencias y «Cargar más»; no cargar todo el catálogo.
- **Yes:** panel por secciones y tarjetas de variantes en móvil; la tabla horizontal de la referencia no es el objetivo de uso táctil.
- **Yes:** guardar producto y cada variante por separado; los campos y fotos de una variante se envían juntos al PATCH atómico de SPEC 05.
- **Yes:** consulta de solo lectura para `PRODUCTOS_LEER` y comprobación de `PRODUCTOS_EDITAR` al ejecutar; ocultar controles no reemplaza seguridad de API.
- **No:** guardar en el navegador como la referencia; únicamente cambios confirmados en servidor y producto enlazado por URL.
- **No:** cambiar SKU, atributos de variantes existentes ni herencia de galería; son operaciones distintas a esta edición acotada.

## Risks

| Risk | Mitigation |
| --- | --- |
| Una búsqueda anterior responde después de escribir otro término. | Incluir término/página en la clave de consulta y mostrar resultados solo del término vigente; cancelar o ignorar respuestas obsoletas. |
| Al añadir fotos propias desaparece visualmente la galería heredada. | Etiquetar el origen antes de guardar y explicar el cambio; al quedar sin fotos propias, volver a consultar la galería heredada. |
| Cambiar de producto o ruta pierde ediciones pendientes. | Señalar formularios sucios, confirmar salida/cambio y mantener datos locales al cancelar o tras fallo de guardado. |

## What is **not** in this spec

- Ningún nuevo endpoint: SPEC 05 implementa búsqueda y escritura de variantes.
- Ninguna edición de inventario, SKU o atributos de variantes existentes, ni persistencia local de borradores.
