# SPEC 01 — Página de productos con listado, paginación y filtros

> **Status:** Implementado
> **Depends on:** API `ApiTienda` SPEC 06 (CRUD de products, ya implementado). Primer spec del frontend.
> **Date:** 2026-08-16
> **Objective:** Crear la página `/mantenimiento/productos` que lista productos desde `GET /products` con paginación y filtros (search, precio y stock mín/máx), permite eliminar producto, y muestra un botón "Nuevo producto" deshabilitado como placeholder del spec futuro de crear/editar.

## Scope

**In:**

- Modelos `Product`, `ProductAttribute`, `ProductFilter` en `src/app/core/models/product.model.ts` (mapeo del `ProductDto` de la API).
- `ProductsService` en `src/app/core/api/products.service.ts` con `findAll(filter)` y `remove(id)` (patrón `BaseProductsService`).
- Página `feature/mantenimiento/products/pages/products.page.ts` + `.html`:
  - Tabla: ID, nombre computado, base product, attributes compactos ("Atributo: Valor, …"), stock, precio, acciones.
  - Paginación con `PaginationNg` (page/pageSize), reset a página 1 al filtrar.
  - Filtros: `search` (debounce 300 ms) + `minPrice`/`maxPrice`/`minStock` (numéricos, solo se envían si tienen valor).
  - Estados de carga (spinner) y error (alert), como en marcas.
  - Eliminar con `confirm-dialog` + toast (paridad con marcas/base-products).
  - Botón "Nuevo producto" **deshabilitado** (placeholder).
- Ruta `/mantenimiento/productos` en `mantenimiento.routes.ts` (lazy `loadComponent`, breadcrumb y title). Coincide con el item del menú ya existente en `dashboard.service.ts`.

**Out of scope (specs futuros):**

- Crear y editar producto (`POST`/`PATCH /products`) — el botón queda deshabilitado.
- Detalle de producto (`GET /products/:id`).
- Filtro por `baseProductId` y ordenamiento (la API no lo soporta aún).

## Data model

No introduce estructuras nuevas en backend; replica el DTO de respuesta en el frontend:

```ts
// src/app/core/models/product.model.ts
import { PaginationQuery } from './pagination.model';

export interface ProductAttribute {
  attributeId: number;
  attributeName: string;
  attributeValueId: number;
  attributeValue: string;
}

export interface Product {
  id: number;
  name: string; // computado por la API
  stock: number; // number (la API hace parseFloat)
  price: number;
  baseProductId: number;
  baseProductName: string;
  productAttributes: ProductAttribute[];
}

export interface ProductFilter extends PaginationQuery {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
}
```

## Implementation plan

1. Crear `core/models/product.model.ts` con las interfaces anteriores.
2. Crear `core/api/products.service.ts` con `findAll(filter)` (usando `buildParams`) y `remove(id)`.
3. Crear `products/pages/products.page.ts`: signals `page`/`pageSize`, `search$` debounced, signals de filtros numéricos, `httpResource` (patrón marcas) o observable (patrón base-products) contra `GET /products`; `onSearch`, `onFilter`, `onDelete` con confirm + toast.
4. Crear `products.page.html`: barra de filtros, botón "Nuevo producto" deshabilitado, tabla, `PaginationNg` y estados loading/error/vacío.
5. Registrar la ruta `{ path: 'productos', data: { breadcrumb: 'Productos' }, loadComponent, title: 'Productos' }` en `mantenimiento.routes.ts`.
6. Verificación: `ng build` + `npm run lint` + prueba manual.

## Acceptance criteria

- [x] `/mantenimiento/productos` muestra la página con breadcrumb "Productos".
- [x] Consume `GET /products` y muestra la tabla con columnas ID, Nombre, Base, Attributes, Stock, Precio, Acciones.
- [x] La columna attributes muestra "Atributo: Valor, …"; si no hay → "—".
- [x] La paginación funciona (page/pageSize recargan la tabla).
- [x] `search` filtra con debounce y resetea a página 1.
- [x] `minPrice`/`maxPrice`/`minStock` filtran y resetan a página 1.
- [x] Spinner en carga, alert con mensaje de la API en error, fila "No hay productos" en vacío.
- [x] Eliminar pide confirmación, llama a `DELETE /products/:id`, quita la fila y muestra toast (éxito/error).
- [x] Botón "Nuevo producto" visible y deshabilitado.
- [x] `ng build` y `npm run lint` pasan sin errores.

## Decisions

- **Sí:** carpeta `feature/mantenimiento/products/` y ruta `/mantenimiento/productos` (coincide con el menú ya definido).
- **Sí:** incluir eliminar, paridad con marcas y base-products.
- **Sí:** filtros `search` + `minPrice` + `maxPrice` + `minStock`, todos soportados por la API.
- **Sí:** columna de attributes compacta en el listado.
- **Sí:** botón "Nuevo producto" deshabilitado como placeholder (el formulario llega en el spec siguiente).
- **No:** crear/editar, detalle ni filtro `baseProductId` — specs futuros.

## Risks

| Risk                                                           | Mitigation                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `price`/`stock` son `decimal` en BD pero llegan como `number`. | La API ya hace `parseFloat`; el modelo frontend los tipa `number`.  |
| Cambios en el DTO de respuesta de la API rompen el listado.    | Modelos aislados en `core/models`; ajuste puntual si la API cambia. |
