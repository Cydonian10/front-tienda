# SPEC 11 — Interfaz de marcas y categorías en el catálogo

> **Status:** Aprobado
> **Depends on:** SPEC 10, SPEC 06
> **Date:** 2026-10-24
> **Objective:** Administrar marcas y categorías desde el catálogo e incorporar su selección obligatoria en la creación y gestión de productos.

## Why this spec exists

SPEC 10 ya ofrece los catálogos en la API y exige relaciones al crear productos, pero la interfaz actual no permite administrar esos registros ni enviar `marcaId` y `categoriasIds`. Esta spec cierra esa incompatibilidad sin alterar la gestión de variantes, unidades o inventario.

## Scope

**In:**

- Añadir entradas «Marcas» y «Categorías» al grupo «Catálogo» del menú y rutas independientes `/admin/inventario/marcas` y `/admin/inventario/categorias`, protegidas con `PRODUCTOS_LEER` de INVENTARIO.
- Mostrar listados remotos de 20 registros por página, con búsqueda por nombre desde dos caracteres y filtro «Todos / Activos / Inactivos». Distinguir carga inicial, lista vacía, búsqueda sin resultados y error con reintento.
- Permitir crear, consultar, editar y desactivar/reactivar registros con `PRODUCTOS_EDITAR`; no ofrecer borrado físico. Mostrar nombre y estado en ambos listados, descripción en categorías y miniatura o ausencia de imagen en marcas.
- Crear marcas sin imagen o con una imagen JPEG, PNG o WebP de hasta 5 MB. Permitir previsualizar, reemplazar y quitar la imagen al editar; cargar las imágenes guardadas mediante la petición autenticada `GET /api/marcas/:id/imagen` y liberar las URL de objeto al dejar de usarlas.
- Permitir descripción opcional en categorías y quitarla en edición. Validar el nombre recortado de 1 a 200 caracteres y presentar conflictos de nombre u otros errores de la API sin perder los cambios pendientes.
- Incorporar en «Datos generales» de productos una selección buscable de exactamente una marca y varias categorías activas, con resultados paginados y seleccionadas visibles; enviar `marcaId` y `categoriasIds` al crear. En gestión, mostrarlas y permitir cambiarlas en el mismo guardado que los otros datos generales.
- Conservar y señalar las relaciones inactivas ya asignadas a un producto; permitir guardar otros datos sin reemplazarlas. Ofrecer solo opciones activas para nuevas asignaciones y mostrar el rechazo del servidor si una opción se desactiva antes del guardado.
- Ofrecer lectura sin controles de escritura a quien solo tenga `PRODUCTOS_LEER`; comprobar `PRODUCTOS_EDITAR` también en los manejadores antes de cada mutación. Confirmar descarte de formularios de catálogo con cambios pendientes al cerrarlos o navegar; conservarlos ante errores de guardado.
- Adaptar páginas y selectores a móvil, teclado, temas `ferreteria`/`light` y tokens de `DESIGN.md` con componentes daisyUI existentes.

**Out of scope (for future specs):**

- Alta rápida de marcas o categorías desde el formulario de producto, jerarquía de categorías y borrado físico.
- Cambios en la API, nuevos permisos, carga pública o almacenamiento externo de imágenes.
- Cambios en variantes, unidades, existencias, compras o movimientos; persistencia local de borradores.

## Data model

- `src/app/api/interfaces/inventario/marca.interface.ts`: `Marca { id: string; nombre: string; activo: boolean; imagenId: string | null }`, `MarcasPagina { items: Marca[]; page: number; limit: number; totalItems: number }` y datos de alta/edición con `nombre`, `imagen?: File` y `quitarImagen?: boolean` solo en edición.
- `src/app/api/interfaces/inventario/categoria.interface.ts`: `Categoria { id: string; nombre: string; descripcion: string | null; activo: boolean }`, `CategoriasPagina` con la misma estructura paginada y datos de alta/edición con descripción nullable para poder quitarla.
- `src/app/api/inventario/marca-api.ts` y `categoria-api.ts`: listados `{ q?, activo?, page, limit }`, detalle, alta, edición y cambio de estado; `MarcaApi` añade lectura de imagen como `Blob`. Una edición de marca sin imagen nueva ni `quitarImagen` conserva la existente; no se envían ambas operaciones a la vez.
- `src/app/api/interfaces/inventario/producto.interface.ts`: `CreateProductDto` añade `marcaId: string` y `categoriasIds: string[]` no vacío; `UpdateProductDto` permite sustituir esos campos cuando cambian. `ProductResponse` añade `marca: { id: string; nombre: string; activo: boolean; imagenId: string | null }` y `categorias: { id: string; nombre: string; activo: boolean }[]`.
- `src/app/api/inventario/product-api.ts`: incluir `marcaId` y `categoriasIds` como arreglo JSON en el multipart de creación. En PATCH, enviar relaciones solamente si se modificaron, tanto en JSON como en multipart con imágenes; nunca enviar una lista de categorías vacía ni forzar reasignación de relaciones inactivas sin cambios.
- `src/app/inventario/actions/use-marcas-action.ts` y `use-categorias-action.ts`: consultas con claves estables que incluyan búsqueda, estado y página; mutaciones con invalidación acotada del catálogo afectado y de los detalles de producto afectados. Los filtros, la página visible, los archivos nuevos y los cambios aún sin guardar son estado local de señales; no se persisten entre sesiones.
- `src/app/inventario/pages/marcas/` y `src/app/inventario/pages/categorias/` contienen las páginas, plantillas y componentes locales de formulario/listado. `src/app/inventario/pages/productos/components/datos-generales-step/` aloja o integra los selectores reutilizables de marca y categorías para creación y gestión.

## Implementation plan

1. Añadir contratos de marcas, categorías y relaciones de producto en `src/app/api/interfaces/inventario/`; actualizar fixtures y pruebas de contratos del producto antes de conectar vistas.
2. Crear `marca-api.ts` y `categoria-api.ts` en `src/app/api/inventario/` con pruebas de paginación, filtros, multipart de imagen, edición, estado y lectura autenticada como `Blob`.
3. Crear consultas y mutaciones en `src/app/inventario/actions/` con claves por filtros/página e invalidación selectiva; probar que una respuesta de búsqueda anterior no sustituya los resultados de la búsqueda vigente.
4. Registrar ambas rutas en `src/app/inventario/inventario.routes.ts` y ambas entradas en `src/app/system-portal/services/control-access/system-menu.service.ts`; probar acceso de lectura y ausencia de enlace sin permiso.
5. Construir primero la página de categorías en `src/app/inventario/pages/categorias/` con listado, búsqueda, filtro, paginación, formulario y estado; cubrir vacíos, fallos, permisos, confirmación de descarte y descripción nullable.
6. Construir la página de marcas en `src/app/inventario/pages/marcas/` con las mismas operaciones y gestión de imagen autenticada; cubrir previsualización, sustitución, retirada, validaciones y liberación de URL de objeto.
7. Extender `src/app/api/inventario/product-api.ts` y sus pruebas para creación multipart y PATCH JSON/multipart de relaciones; conservar el resto del contrato de producto y variantes.
8. Incorporar en `src/app/inventario/pages/productos/components/datos-generales-step/` selectores buscables y paginados de marcas/categorías activas. Exigir una marca y al menos una categoría para crear; enlazar a sus páginas si no hay opciones, sin crear catálogos desde el formulario.
9. Adaptar el panel de gestión de `src/app/inventario/pages/productos/gestion-productos-page.ts` y el mismo paso de datos generales para mostrar asociaciones actuales, señalar inactivas, detectar cambios y guardar relaciones junto a los otros campos; conservar borradores y protección de salida existentes ante fallos.
10. Completar pruebas de permisos al ejecutar, carrera con registros desactivados, teclado, móvil y ambos temas; ejecutar `npm test -- --watch=false` y `npm run build` en `front-tienda`.

## Acceptance criteria

- [ ] «Marcas» y «Categorías» aparecen en «Catálogo» solo con `PRODUCTOS_LEER` de INVENTARIO; ambas rutas niegan el acceso sin ese permiso.
- [ ] Los listados muestran 20 registros por página, permiten avanzar/retroceder, buscar desde dos caracteres y combinar búsqueda con los tres estados; con menos de dos caracteres no envían `q` a la API.
- [ ] Cada listado distingue carga, vacío sin registros, búsqueda sin coincidencias y error recuperable con «Reintentar»; muestra activos e inactivos identificables.
- [ ] Con solo `PRODUCTOS_LEER` se puede consultar listados e imágenes, pero no crear, editar, subir/quitar imágenes ni cambiar estado, aunque se intente invocar el manejador directamente.
- [ ] Con `PRODUCTOS_EDITAR` se pueden crear, editar, desactivar y reactivar ambos catálogos; no hay opción de borrado físico. Un nombre vacío, de más de 200 caracteres o duplicado muestra error sin cerrar el formulario.
- [ ] Una categoría puede quedar sin descripción tras editarla. Una marca admite JPEG, PNG o WebP de hasta 5 MB; se puede crear sin imagen, visualizar su imagen guardada con autenticación, reemplazarla y quitarla.
- [ ] Archivos inválidos o de más de 5 MB se rechazan antes de enviar; un fallo al cargar la miniatura no impide consultar el registro. Las previsualizaciones no dejan URL de objeto activas al cerrarse o reemplazarse.
- [ ] Cerrar un formulario de catálogo con cambios o salir de la ruta pide confirmar descarte; cancelar mantiene los campos y un error de API no borra los datos pendientes.
- [ ] Crear un producto exige elegir una marca y al menos una categoría activa y envía `marcaId` y `categoriasIds` como JSON en el multipart; el asistente sigue avanzando tras una creación válida.
- [ ] La gestión muestra marca y categorías actuales, incluidas las inactivas con advertencia. Cambiar asociaciones guarda en el mismo PATCH que los demás datos generales; guardar solo otros campos conserva asociaciones inactivas sin reenviarlas.
- [ ] Los selectores de producto buscan en la API con paginación y nunca ofrecen registros inactivos para nuevas asignaciones; si una selección se desactiva antes de guardar, se muestra el error del servidor y permanecen las elecciones del usuario.
- [ ] Los controles se pueden usar con teclado; a 390 px no hay desbordamiento horizontal de página y las vistas funcionan con `ferreteria` y `light`.
- [ ] Pasan las pruebas relevantes, `npm test -- --watch=false` y `npm run build` en `front-tienda`.

## Decisions

- **Yes:** dos páginas y entradas independientes en «Catálogo»; permiten administrar marcas y categorías sin sobrecargar el formulario de producto.
- **Yes:** incluir administración y selección en productos en esta spec; el alta actual es incompatible con la API de SPEC 10 sin las relaciones obligatorias.
- **Yes:** listados paginados de 20 con filtro de estado y búsqueda remota desde dos caracteres; no cargar todos los registros en el navegador.
- **Yes:** una marca y múltiples categorías activas con selección buscable y paginada; las ya asignadas e inactivas se conservan y se advierten sin bloquear otras ediciones.
- **Yes:** gestionar por completo la imagen opcional de marca, usando su endpoint autenticado y no una URL pública.
- **Yes:** guardar relaciones junto con datos generales, conservando el guardado existente de variantes por separado.
- **Yes:** lectura con `PRODUCTOS_LEER` y escritura con `PRODUCTOS_EDITAR`; confirmar descarte de cambios de formularios de catálogo.
- **No:** alta rápida desde producto, borrado físico, nuevos permisos o cambios en API; cada uno ampliaría el alcance o contradiría SPEC 10.

## Risks

| Risk                                                                                                                | Mitigation                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| La búsqueda paginada no muestra una asociación ya seleccionada que aparece en otra página o está inactiva.          | Mantener las seleccionadas a partir del detalle del producto y mostrarlas aparte; usar resultados remotos solo para nuevas selecciones activas. |
| Una marca o categoría se desactiva entre su selección y el guardado del producto.                                   | Mostrar el error de la API sin limpiar el formulario y permitir sustituir la selección.                                                         |
| El endpoint de imagen requiere autenticación y una URL directa en `<img>` no la envía mediante el interceptor HTTP. | Solicitar el archivo como `Blob`, presentar una URL de objeto temporal y revocarla cuando corresponda.                                          |
| El PATCH multipart reenvía relaciones inactivas sin cambios y provoca un rechazo inesperado.                        | Enviar `marcaId` y `categoriasIds` solo cuando realmente cambien; cubrir rutas JSON y multipart con pruebas.                                    |

## What is **not** in this spec

- Ninguna creación rápida de catálogos dentro de productos, jerarquía de categorías ni borrado físico.
- Ningún endpoint, permiso o almacenamiento de imagen nuevo; tampoco cambios de variantes, unidades o inventario.
