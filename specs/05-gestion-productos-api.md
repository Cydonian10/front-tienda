# SPEC 05 — API para gestionar productos y variantes existentes

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-18
> **Objective:** Permitir buscar productos existentes y actualizar sus variantes de forma segura sin reinterpretar existencias ni perder imágenes.

## Why this spec exists

La pantalla de productos ya puede consultar y actualizar un producto por ID, crear variantes y modificar la galería del producto, pero no puede buscar productos ni actualizar variantes existentes. La referencia `https://inventario-productos-gabriel.zudex85.chatgpt.site/` usa datos locales; esta API trabajará con los datos persistidos y conservará las reglas de inventario.

## Scope

**In:**

- Añadir `GET /api/productos?q=<nombre>&page=<n>&limit=20` con búsqueda paginada por nombre e inclusión de productos activos e inactivos. Requerir `PRODUCTOS_LEER`.
- Ampliar `ProductResponseDto` con `puedeCambiarUnidadBase` para indicar si se permite cambiar la unidad base, tanto en `GET /api/productos/:id` y `PATCH /api/productos/:id` como en `POST /api/productos`, que comparte el DTO.
- Rechazar en `PATCH /api/productos/:id` el cambio de unidad base cuando cualquier variante del producto tenga saldo distinto de cero o detalles de movimientos históricos; comprobarlo también en servidor durante la escritura. Los demás campos siguen editables.
- Añadir `PATCH /api/productos/:productoId/variantes/:varianteId` con actualización parcial de `precio`, `codigoBarras`, `activo` y galería propia de la variante. Requerir `PRODUCTOS_EDITAR` y verificar la pertenencia de la variante al producto.
- Guardar campos e imágenes de cada variante como una sola operación: una validación o carga fallida no deja campos cambiados ni asociaciones de fotos modificadas. Mantener las fotos existentes si no se envía una instrucción de galería.
- Conservar el comportamiento de herencia: sin fotos propias se muestran las del producto; las heredadas no se borran desde la variante. Al añadir fotos propias se muestran estas en lugar de las heredadas; al quitar la última propia vuelve a mostrarse la galería del producto.
- Exigir `PRODUCTOS_LEER` en lectura de imágenes de producto/variante y `PRODUCTOS_EDITAR` en operaciones que las cambian, incluidas las rutas de imágenes existentes. Mantener la posibilidad de desactivar productos o variantes con stock, sin alterar saldos ni historial.

**Out of scope (for future specs):**

- Interfaz Angular, selector, ruta y adaptación móvil; pertenecen a SPEC 06.
- Cambiar SKU o valores de atributos de variantes existentes; añadir atributos al producto desde gestión; edición de portada u orden manual de fotos.
- Corregir existencias, cambiar conversiones o unidad base de un producto con saldos o movimientos, y borrar productos o variantes.
- Persistir búsquedas o borradores en el navegador y copiar imágenes heredadas a la galería propia.

## Data model

- `api-tienda/src/features/inventory/products/dto/`: respuesta paginada de búsqueda `{ items: { id: string; nombre: string; activo: boolean }[], page: number, limit: number, totalItems: number }`. `q` requiere al menos dos caracteres; `page` empieza en 1; `limit` es 20 por defecto; el orden es estable por nombre e ID. `totalItems` permite calcular «Cargar más».
- `ProductResponseDto` añade `puedeCambiarUnidadBase: boolean`. Es `false` si existe un `DetalleMovimiento` de cualquier variante o una `Existencia` con cantidad distinta de cero, incluso en almacenes inactivos. Se calcula al leer y se vuelve a comprobar al intentar modificar `unidadBaseId`; un cambio rechazado devuelve un error de negocio, no cambia el producto y no depende de la bandera enviada por el cliente.
- `api-tienda/src/features/inventory/variante-producto/dto/update-variante.dto.ts`: contrato parcial `precio?: string`, `codigoBarras?: string | null`, `activo?: boolean`, `imagenesConservarIds?: string[]`, `imagenes?: File[]`. `precio` conserva validación decimal de dos posiciones; `null` elimina el código; omitir un campo no lo modifica. `imagenesConservarIds` contiene IDs de asociaciones **propias** de esa variante; omitirlo conserva la galería; `[]` elimina todas las fotos propias. `imagenes` admite JPEG/PNG/WebP de hasta 5 MB cada una y el resultado tiene como máximo 10 fotos propias.
- La respuesta del PATCH de variante reutiliza `VarianteResponseDto` y sus `imagenes` propias; `GET /api/productos/:productoId/variantes/:varianteId/imagenes` ya devuelve `origen: 'producto' | 'variante'` para distinguir fotos heredadas de fotos editables. No se añaden tablas ni columnas.

## Implementation plan

1. Añadir DTO y consulta paginada de productos por nombre en `api-tienda/src/features/inventory/products/queries/` y `products.controller.ts`; probar búsqueda, productos inactivos, paginación y `PRODUCTOS_LEER`.
2. Incorporar el cálculo de `puedeCambiarUnidadBase` en lectura y actualización del producto; proteger el cambio en `update-product.handler.ts` frente a saldos y movimientos, con pruebas para historial con saldo cero y para cambio permitido sin historial.
3. Crear DTO, comando y manejador de actualización en `api-tienda/src/features/inventory/variante-producto/`; registrar el PATCH en `variantes.controller.ts` y los proveedores en `inventory.module.ts`; probar campos parciales, pertenencia y permisos.
4. Incorporar a ese PATCH el reemplazo selectivo de fotos propias en la misma operación que los campos, con compensación de archivos si falla la transacción; probar conservar, agregar, quitar, límite, herencia y rechazo sin cambios parciales.
5. Aplicar permisos de lectura y edición a `api-tienda/src/features/images/images.controller.ts` y `variant-images.controller.ts`; probar que `PRODUCTOS_LEER` solo consulta y que la desactivación con stock no altera movimientos ni saldos.

## Acceptance criteria

- [ ] `GET /api/productos` sin `PRODUCTOS_LEER` es denegado; con el permiso y `q` de al menos dos caracteres devuelve nombre coincidente, activos e inactivos, `page`, `limit`, `totalItems` y páginas sin duplicados.
- [ ] Los resultados no se filtran únicamente en memoria ni devuelven el catálogo completo para un selector; un `q` inválido o página inválida se rechaza.
- [ ] `GET /api/productos/:id` devuelve `puedeCambiarUnidadBase = false` con saldo no nulo o un movimiento histórico aunque hoy el saldo sea cero; si no existen ambos, devuelve `true`.
- [ ] Cambiar la unidad base bloqueada mediante PATCH produce error y no modifica el producto, incluso si el cliente ignora la bandera; actualizar nombre, descripción, estado y galería continúa permitido.
- [ ] El PATCH de variante acepta precio, código anulable, estado y fotos propias, pero no cambia SKU ni valores de atributos; sin `PRODUCTOS_EDITAR`, con variante ajena o IDs de imágenes ajenos, se rechaza.
- [ ] Si falla una validación, almacenamiento o escritura de imágenes de variante, permanecen intactos tanto los campos como la galería persistidos; omitir `imagenesConservarIds` conserva las fotos previas.
- [ ] La galería heredada no se puede eliminar desde una variante; cargar una foto propia sustituye visualmente la herencia y quitar la última propia la restablece.
- [ ] Una variante o producto puede pasar a inactivo con stock sin eliminarlo ni cambiar cantidades o movimientos; los endpoints existentes de imágenes rechazan lectura sin `PRODUCTOS_LEER` y escritura sin `PRODUCTOS_EDITAR`.
- [ ] La compilación y las pruebas específicas pasan en `api-tienda`.

## Decisions

- **Yes:** API y UI en especificaciones separadas; SPEC 06 depende de este contrato para no simular guardados locales.
- **Yes:** búsqueda por nombre remoto y paginado, no por SKU; incluye inactivos para permitir su reactivación.
- **Yes:** actualización parcial y atómica por variante, incluida su galería propia; evita un «Guardado correcto» tras un cambio incompleto.
- **Yes:** bloquear cambio de unidad base con saldos o cualquier movimiento, aunque el saldo actual sea cero; las cantidades históricas usan la unidad original.
- **Yes:** permitir desactivar catálogo con stock sin mutar inventario; el estado del catálogo no borra la obligación de consultar ese saldo.
- **No:** editar SKU, valores de atributos, portada u orden de fotos; no forman parte de la gestión solicitada.
- **No:** copiar o eliminar desde la variante las fotos heredadas del producto; solo se administran sus fotos propias.

## Risks

| Risk                                                                       | Mitigation                                                                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Un cambio concurrente crea un movimiento durante el cambio de unidad base. | Verificar saldos y movimientos dentro de la escritura del producto con bloqueo o aislamiento suficiente y probar concurrencia.                   |
| Los archivos están fuera de la transacción de base de datos.               | Limpiar archivos nuevos tras fallar y retirar archivos anteriores solo después de confirmar, siguiendo el patrón de `update-product.handler.ts`. |
| Las rutas antiguas de imágenes podrían eludir el permiso del PATCH.        | Proteger también los controladores de imágenes de producto y variante; probar acceso directo sin permisos.                                       |

## What is **not** in this spec

- Ninguna pantalla, búsqueda visual ni UI móvil; eso corresponde a SPEC 06.
- Ninguna modificación de stock, SKU, valores de atributos o fotografías heredadas desde una variante.
