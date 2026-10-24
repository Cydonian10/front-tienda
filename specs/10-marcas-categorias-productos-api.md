# SPEC 10 — API de marcas y categorías para productos

> **Status:** Borrador
> **Depends on:** SPEC 05
> **Date:** 2026-10-23
> **Objective:** Crear catálogos de marcas y categorías en la API y exigir una marca y al menos una categoría al registrar productos.

## Why this spec exists

El producto actual no tiene marca ni categorías. Antes de incorporar la página de catálogos y los selectores de productos, la API debe definir sus relaciones, validaciones, permisos y contratos. El proyecto aún está en desarrollo y se ha aceptado reiniciar manualmente los datos de desarrollo antes de exigir estas relaciones.

## Scope

**In:**

- Crear catálogos persistentes de marcas y categorías planas, con nombre único sin distinguir mayúsculas, estado activo/inactivo e identificador UUID. La categoría admite descripción opcional; la marca admite una imagen opcional subida a la API.
- Exponer creación, listado paginado con búsqueda y filtro de estado, detalle, edición y cambio de estado de ambos catálogos. No habrá borrado físico.
- Almacenar la imagen de marca con el `ImageStorage` local existente; ofrecer lectura por endpoint autenticado, reemplazo y eliminación de la imagen sin eliminar la marca.
- Exigir exactamente una marca activa y una o más categorías activas al crear un producto. En la edición permitir reemplazar la marca o el conjunto de categorías sin afectar los demás campos.
- Conservar las relaciones de productos con catálogos desactivados, sin admitir nuevas asignaciones a esos registros. Los cambios de producto que no toquen las relaciones permanecen permitidos.
- Reutilizar `PRODUCTOS_LEER` y `PRODUCTOS_EDITAR` de INVENTARIO para ambos catálogos, sin crear ocho permisos nuevos; comprobarlos en cada endpoint y presentar su administración dentro de los grupos «Consultar catálogo» y «Gestionar catálogo».
- Añadir una migración que crea las tablas y relaciones, pero falla si encuentra productos preexistentes. El reinicio de la base de desarrollo es un requisito manual previo, no una acción automática de la migración.

**Out of scope (for future specs):**

- Página Angular de gestión de marcas y categorías, menú, diseño visual y selectores en creación/gestión de productos. Irán en una spec de interfaz dependiente de esta API.
- Subida a S3, URLs de imagen externas, categorías jerárquicas y borrado físico de catálogos.
- Migración de productos históricos, borrado automatizado de datos de desarrollo, cambios de inventario o modificación de movimientos y compras.

## Data model

- `api-tienda/src/features/inventory/entities/marca.entity.ts`: `Marca { id: uuid, nombre: string, activo: boolean, imagen: Imagen | null }`. Imagen opcional de propiedad exclusiva de la marca; el archivo se referencia por `Imagen.id`, no por URL externa.
- `api-tienda/src/features/inventory/entities/categoria.entity.ts`: `Categoria { id: uuid, nombre: string, descripcion: string | null, activo: boolean }`. Sin categoría padre ni jerarquía.
- `api-tienda/src/features/inventory/entities/producto.entity.ts`: relación `marca: Marca` obligatoria mediante `marca_id NOT NULL` y relación de muchas categorías por producto mediante tabla `productos_categorias(producto_id, categoria_id)` con clave compuesta para impedir duplicados. Un producto conserva una marca y al menos una categoría; esta última regla se valida en los comandos de creación/edición además de los índices y claves foráneas.
- Nueva migración en `api-tienda/src/database/migrations/`: verifica primero que `productos` esté vacía; si no, falla sin borrar datos ni aplicar parcialmente el esquema. Define nombres únicos normalizados (recorte y comparación sin distinguir mayúsculas) para ambas tablas y las claves foráneas que impiden borrar catálogos referenciados.
- En `api-tienda/src/features/inventory/marcas/` y `categorias/`: DTO, controlador, consultas y comandos. `POST /api/marcas` acepta `nombre`, `activo?` e `imagen?`; `PATCH /api/marcas/:id` admite `nombre?`, un archivo `imagen?` o `quitarImagen?`. Omitir la imagen conserva la actual; enviar un archivo la reemplaza; `quitarImagen=true` la quita; se rechaza solicitar ambas operaciones juntas. La imagen admite JPEG, PNG o WebP válidos de hasta 5 MB. `POST/PATCH /api/categorias` aceptan `nombre`, `descripcion?` y sus versiones parciales; omitir la descripción en PATCH la conserva y enviarla como `null` la elimina. Los nombres deben tener entre 1 y 200 caracteres tras recortar espacios; la descripción es opcional.
- `GET /api/marcas` y `GET /api/categorias` aceptan `q?` (nombre, mínimo 2 caracteres si aparece), `activo?`, `page?` desde 1 y `limit?` (20 por defecto, máximo 100); devuelven `{ items, page, limit, totalItems }`, incluyendo activos e inactivos si no se filtra, ordenados por nombre e ID. `GET /api/marcas/:id` y `GET /api/categorias/:id` leen un registro aunque esté inactivo. Las respuestas de marca incluyen `imagenId: string | null`; `GET /api/marcas/:id/imagen` sirve el archivo referenciado o devuelve 404 si no existe.
- `PATCH /api/marcas/:id/estado` y `PATCH /api/categorias/:id/estado` reciben `{ activo: boolean }`; `PATCH /:id` de datos no cambia el estado. Las lecturas, incluida la imagen de marca, requieren `PRODUCTOS_LEER` en INVENTARIO. Las altas, ediciones y cambios de estado requieren `PRODUCTOS_EDITAR` en INVENTARIO.
- `api-tienda/src/features/inventory/products/dto/create-product.dto.ts` añade `marcaId: uuid` y `categoriasIds: uuid[]` no vacío, sin duplicados. El multipart de creación acepta `categoriasIds` como arreglo JSON de UUID, igual que otros arreglos existentes del formulario. `update-product.dto.ts` acepta los mismos campos opcionales; omitirlos conserva sus relaciones, enviarlos las reemplaza y `categoriasIds: []` se rechaza. Crear o asignar una relación nueva exige que el registro exista y esté activo; reenviar los mismos IDs ya asociados no obliga a reactivar catálogos inactivos.
- `ProductResponseDto` en `api-tienda/src/features/inventory/products/dto/product-response.dto.ts` incluye `marca: { id, nombre, activo, imagenId }` y `categorias: { id, nombre, activo }[]`, incluso si están inactivas. `PRODUCTOS_LEER` basta para ver estos datos sin permisos adicionales de catálogo. Búsqueda paginada de productos y contratos de variantes conservan su forma actual.
- Se conserva el catálogo técnico de permisos existente. `src/app/access-control/models/access-groups.ts` ya agrupa la lectura y edición de productos dentro de los accesos de catálogo; al implementar la interfaz de marcas y categorías se reutilizarán estas mismas comprobaciones, sin asignaciones nuevas automáticas.

## Implementation plan

1. Documentar el requisito de reiniciar **manualmente solo la base de desarrollo** antes de esta migración; crear la migración con comprobación de productos preexistentes y tablas nuevas. Probar que una base con productos causa fallo sin pérdidas y que una vacía migra correctamente.
2. Añadir `Marca` y `Categoria` a `api-tienda/src/features/inventory/entities/`, sus relaciones en `Producto` y el registro de entidades en `inventory.module.ts`. Probar unicidad normalizada y que la tabla de unión no duplica asociaciones.
3. Añadir pruebas de autorización que reutilicen `PRODUCTOS_LEER`/`PRODUCTOS_EDITAR` de INVENTARIO; comprobar que un permiso del mismo nombre en otro sistema no concede acceso.
4. Crear DTO, consulta paginada, lectura por ID, controlador y pruebas de categorías en `api-tienda/src/features/inventory/categorias/`; cubrir filtro, errores y permiso de lectura.
5. Añadir alta, edición y cambio de estado de categorías con `PRODUCTOS_EDITAR`. Probar conflicto por nombre, descripción opcional y conservación de asociaciones al desactivar.
6. Crear DTO, consulta paginada, lectura por ID, controlador y pruebas de marcas en `api-tienda/src/features/inventory/marcas/`; mantener la imagen ausente como `imagenId: null` y cubrir permisos de lectura.
7. Añadir alta, edición y cambio de estado de marcas sin imagen. Incorporar después la subida, lectura, reemplazo y retirada del archivo usando `Imagen` y `ImageStorage`; probar validación y limpieza ante fallos para no dejar asociaciones a archivos inexistentes.
8. Extender `CreateProductSchema`, comando, manejador y pruebas en `api-tienda/src/features/inventory/products/` para validar marca y categorías activas y guardarlas atómicamente junto con el producto; incluir multipart y errores sin producto parcial.
9. Extender el PATCH, la lectura por ID y `ProductResponseDto` para sustituir relaciones enviadas y conservar las omitidas. Probar rechazos atómicos, IDs duplicados, inactivos nuevos y cambios de otros campos con asociaciones inactivas existentes.
10. Integrar controladores y manejadores en `inventory.module.ts`; ejecutar pruebas de API y compilación, y verificar en una base de desarrollo reiniciada el flujo catálogo → producto → desactivación → edición de otros campos.

## Acceptance criteria

- [ ] En una base de desarrollo vacía la migración crea marcas, categorías y relaciones; con productos preexistentes falla sin borrar productos, variantes, movimientos ni compras.
- [ ] Dos marcas o categorías con el mismo nombre ignorando espacios extremos y mayúsculas no pueden coexistir, incluso bajo solicitudes concurrentes.
- [ ] Ambos catálogos permiten alta, lectura paginada, búsqueda, filtro de estado, detalle, edición y desactivación/reactivación; no tienen endpoint de eliminación física.
- [ ] Un nombre de categoría puede acompañarse de descripción opcional y esta se puede quitar; una marca puede crearse sin imagen, subir una imagen válida, consultarla, reemplazarla o quitarla sin cambiar su ID.
- [ ] Archivos inválidos o mayores de 5 MB se rechazan; si falla el almacenamiento o la escritura, ni la marca ni su imagen previa quedan parcialmente actualizadas.
- [ ] `PRODUCTOS_LEER` de INVENTARIO permite leer ambos catálogos y la imagen; `PRODUCTOS_EDITAR` permite crearlos, editarlos y cambiar su estado. No se crean permisos nuevos ni se publica la imagen sin autenticación.
- [ ] `POST /api/productos` rechaza la falta de marca, `categoriasIds` vacío o duplicado, IDs inexistentes o inactivos; acepta exactamente una marca y varias categorías activas, sin crear un producto parcial en caso de error.
- [ ] `PATCH /api/productos/:id` conserva relaciones omitidas, sustituye las enviadas, rechaza la lista vacía y no altera nada si alguna relación nueva es inválida; admite editar otros campos cuando las relaciones ya existentes están inactivas.
- [ ] Desactivar un catálogo referenciado conserva el producto y sus relaciones, pero impide asignarlo por primera vez a otro producto; reactivarlo vuelve a permitir nuevas asignaciones.
- [ ] `GET /api/productos/:id` y las respuestas de POST/PATCH muestran marca y categorías con estado; quien tiene `PRODUCTOS_LEER` puede verlas sin permisos adicionales.
- [ ] Pasan las pruebas específicas y la compilación de `api-tienda`.

## Decisions

- **Yes:** API primero y página Angular después, siguiendo la separación de SPEC 05/06. Se acepta que el asistente actual de creación no podrá dar de alta productos entre ambas especificaciones.
- **Yes:** marca obligatoria y una o más categorías planas obligatorias en productos nuevos; la asignación se puede modificar en PATCH.
- **Yes:** imagen de marca opcional mediante `ImageStorage` local y `Imagen.id`, no una URL guardada por el usuario.
- **Yes:** nombres únicos sin distinguir mayúsculas; descripción opcional solo para categoría; desactivación conserva vínculos y bloquea nuevas asignaciones.
- **Yes:** reutilizar permisos de productos dentro de grupos de acceso comprensibles; se descarta crear ocho permisos de marcas/categorías para evitar complejidad administrativa innecesaria. La API conserva las comprobaciones por acción y sistema.
- **Yes:** reinicio manual de la base de desarrollo y migración que falla ante productos existentes. No automatizar borrados de datos relacionados.
- **No:** S3, jerarquías, borrado físico, migración de históricos ni UI en esta spec; requieren trabajo separado o no son necesarios ahora.

## Risks

| Risk                                                                                                    | Mitigation                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Reiniciar una base con datos que debían conservarse provoca pérdida de inventario, compras e historial. | Reinicio manual limitado a desarrollo, con respaldo/verificación previa; la migración no ejecuta `DELETE` y falla ante productos existentes. |
| El asistente actual envía productos sin marca ni categorías.                                            | Documentar el intervalo de incompatibilidad aceptado y especificar la interfaz como siguiente trabajo dependiente de esta API.               |
| Un archivo de imagen queda huérfano o se elimina antes de confirmar la edición.                         | Limpiar archivos nuevos al fallar y borrar los antiguos solo después de confirmar la transacción, siguiendo el patrón actual de productos.   |
| Una categoría o marca se desactiva entre su selección y el guardado de producto.                        | Verificar existencia y estado en el servidor durante la transacción de asignación; probar la carrera de actualización.                       |

## What is **not** in this spec

- Ninguna página, menú o selector Angular; tampoco la adaptación visual conforme a `DESIGN.md`.
- Ninguna integración S3, categoría jerárquica, borrado físico ni limpieza automática de datos existentes.
