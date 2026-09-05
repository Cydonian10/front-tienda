# SPEC 03 — Subida de imágenes de producto con principal

> **Status:** Implementado
> **Depends on:** SPEC 02 (crear producto, aporta el `productId`), API `ApiTienda` SPEC 07 (imágenes polimórficas).
> **Date:** 2026-08-18
> **Objective:** Tras crear un producto, permitir subir una o varias imágenes con `POST /images` (una petición por archivo, con estado y progreso individuales), elegir una imagen principal con `PATCH /images/:id`, y finalizar para volver al listado, conservando el `productId` si una imagen falla.

## Scope

**In:**

- Modelo `Image` en `src/app/core/models/image.model.ts` (mapeo del `ImageDto` de la API).
- `ImagesService` en `src/app/core/api/images.service.ts` con:
  - `upload(file, entityType, entityId)` → `POST /images` (multipart, `FormData`).
  - `findAll(entityType, entityId)` → `GET /images`.
  - `setMain(id)` → `PATCH /images/:id` con `{ isMain: true }`.
  - `remove(id)` → `DELETE /images/:id`.
- Vista de subida `feature/mantenimiento/products/pages/product-images.page.ts` + `.html` (o integrada en el flujo de `new-product`), accesible tras crear el producto con el `productId`:
  - Selección de múltiples archivos (jpeg/png/webp, máx 5 MB) con previews.
  - Una petición `POST /images` por archivo, con estado (pendiente/éxito/error) y progreso por archivo.
  - Reintento solo de los archivos fallidos, conservando el `productId` y los exitosos.
  - Regla de principal: si hay una o más imágenes, debe existir una marcada como principal (selector explícito que llama a `PATCH /images/:id`). Sin imágenes, se permite finalizar.
  - Botón "Finalizar" explícito que vuelve al listado `/mantenimiento/productos`.
- Validación visual de tipo y tamaño de archivo antes de subir.
- Estados de carga y error por archivo, y toast global al finalizar.
- Pruebas unitarias (Vitest) para el armado del `FormData`, los estados por archivo y la regla de principal.

**Out of scope (specs futuros):**

- Editar producto y sus imágenes existentes (`PATCH /products/:id`) — SPEC de edición.
- Subida múltiple en una sola petición (el endpoint actual es multipart de un archivo).
- Imágenes en `base_product`.
- Borrado de imágenes desde esta pantalla (se pueden dejar para la edición).

## Data model

```ts
// src/app/core/models/image.model.ts
export interface Image {
  id: number;
  url: string; // '/uploads/<uuid>.ext'
  entityType: string; // 'product'
  entityId: number;
  isMain: boolean;
}
```

```ts
// src/app/core/api/images.service.ts
// upload: FormData con 'file' + 'entityType' + 'entityId'
// findAll: GET /images?entityType=product&entityId=N
// setMain: PATCH /images/:id  { isMain: true }
// remove:  DELETE /images/:id
```

## Implementation plan

1. Crear `core/models/image.model.ts` con `Image`.
2. Crear `core/api/images.service.ts` con `upload`, `findAll`, `setMain` y `remove`.
3. Crear la vista `products/pages/product-images.page.ts` + `.html`: recibe el `productId` (por ruta o parámetro de navegación), permite seleccionar archivos, valida tipo/tamaño y muestra previews.
4. Implementar la subida: recorrer los archivos y llamar a `POST /images` uno por uno, actualizando estado (pendiente/éxito/error) y progreso por archivo.
5. Implementar reintento de archivos fallidos sin duplicar los exitosos.
6. Implementar el selector de imagen principal: si hay imágenes, una debe estar marcada; cambiar la principal llama a `PATCH /images/:id`.
7. Botón "Finalizar": vuelve al listado `/mantenimiento/productos`. Sin imágenes, también permite finalizar.
8. Registrar la ruta del flujo de imágenes y enlazarla desde `new-product.page` tras crear el producto (navegación con el `productId`).
9. Añadir pruebas unitarias (Vitest): armado de `FormData`, transiciones de estado por archivo y regla de principal.
10. Verificación: `ng build` + `npm run lint` + `ng test` + prueba manual contra la API local.

## Acceptance criteria

- [ ] Tras crear un producto, se navega a la vista de imágenes con el `productId`.
- [ ] Se pueden seleccionar varios archivos y se muestran previews.
- [ ] Archivos con tipo distinto de jpeg/png/webp o mayores de 5 MB se rechazan antes de subir.
- [ ] Cada archivo se sube con una petición `POST /images` independiente, mostrando estado (pendiente/éxito/error) y progreso.
- [ ] Se puede reintentar solo los archivos fallidos, conservando el `productId` y los exitosos (sin duplicarlos).
- [ ] Si hay imágenes, una debe estar marcada como principal y se puede cambiar con `PATCH /images/:id`.
- [ ] Sin imágenes, se permite pulsar Finalizar.
- [ ] "Finalizar" vuelve al listado `/mantenimiento/productos`.
- [ ] `ng build`, `npm run lint` y `ng test` pasan sin errores.

## Decisions

- **Sí:** una petición `POST /images` por archivo (se adapta al endpoint multipart actual y permite reintentar solo los fallidos).
- **Sí:** estado y progreso individuales por archivo.
- **Sí:** principal obligatoria solo si existen imágenes; sin imágenes se permite finalizar.
- **Sí:** selector explícito de principal que llama a `PATCH /images/:id`.
- **Sí:** mantener el `productId` y los archivos exitosos cuando una imagen falla.
- **No:** subida múltiple en una sola petición (requeriría cambiar la API).
- **No:** borrado de imágenes desde esta pantalla (se deja para la edición).
- **No:** imágenes en `base_product`.

## Risks

| Risk                                                  | Mitigation                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Falla de una imagen deja el producto creado sin todas | Estado por archivo, reintento selectivo y producto conservado.  |
| El endpoint actual no acepta varias imágenes a la vez | Una petición por archivo; no se modifica la API.                |
| Dependencia de SPEC 02 para el `productId`            | El flujo de imágenes solo se alcanza tras una creación exitosa. |

## What is **not** in this spec

- Editar producto y sus imágenes (`PATCH /products/:id`).
- Subida múltiple en una sola petición.
- Imágenes en `base_product`.
- Borrado de imágenes desde esta pantalla.

Cada uno de esos, si llega, va en su propio spec.
