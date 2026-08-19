# SPEC 02 — Crear producto con selección de base product y atributos

> **Status:** Aprobado
> **Depends on:** SPEC 01, API `ApiTienda` SPEC 06 (CRUD de products), API `ApiTienda` SPEC 13 (brands/categories) y SPEC 05 (base-products).
> **Date:** 2026-08-18
> **Objective:** Crear la página `/mantenimiento/productos/nuevo` con un formulario (Reactive Forms) que permite elegir un base product, ingresar stock y precio, seleccionar atributos con sus valores desde `GET /attributes/batch`, validar los campos y crear el producto con `POST /products`, para luego continuar al flujo de imágenes del SPEC 03.

## Scope

**In:**

- Modelo `AttributeWithValues` y `AttributeValue` en `src/app/core/models/attribute.model.ts` (mapeo de `GET /attributes/batch`).
- `AttributesService` en `src/app/core/api/attributes.service.ts` con `findAllWithValues(filter)` (patrón `ApiService`).
- `ProductsService.create(dto)` en `src/app/core/api/products.service.ts` (nuevo método `POST /products`).
- `CreateProduct` y `ProductAttributeItem` en `src/app/core/models/product.model.ts` (payload de creación).
- Página `feature/mantenimiento/products/pages/new-product.page.ts` + `.html`:
  - Select de base product con búsqueda/paginación contra `GET /base-products`.
  - Atributos cargados con `GET /attributes/batch`, un selector de valor por atributo (opcional, pero al menos uno en total).
  - Campos stock y precio numéricos.
  - Validación frontend: base product requerido, stock y precio mayores que 0, al menos un par atributo-valor seleccionado.
  - Envío a `POST /products`; estados loading/error/success con toast.
  - Tras crear, navega al flujo de imágenes (SPEC 03) conservando el `productId`.
- Cambiar en `products.page.html` el botón "Nuevo producto" de deshabilitado a un enlace a `/mantenimiento/productos/nuevo`.
- Ruta `/mantenimiento/productos/nuevo` en `mantenimiento.routes.ts` (lazy `loadComponent`, breadcrumb y title), como hijo de `productos`.
- Pruebas unitarias (Vitest) para el payload de creación, la validación y los mensajes de error.

**Out of scope (specs futuros):**

- Editar producto (`PATCH /products/:id`) — solo alta.
- Subida de imágenes — es el SPEC 03.
- Filtro por `baseProductId` en el listado (la API lo soporta, no se pide aquí).
- Modificar el contrato de la API para permitir `productAttributes: []` — se mantiene `@ArrayNotEmpty` y el frontend exige al menos un atributo.

## Data model

```ts
// src/app/core/models/attribute.model.ts
export interface AttributeValue {
  id: number;
  value: string;
}

export interface AttributeWithValues {
  id: number;
  name: string;
  values: AttributeValue[];
}

export interface AttributeWithValuesFilter extends PaginationQuery {
  search?: string;
}
```

```ts
// src/app/core/models/product.model.ts (añadir)
export interface ProductAttributeItem {
  attributeId: number;
  attributeValueId: number;
}

export interface CreateProduct {
  stock: number;
  price: number;
  baseProductId: number;
  productAttributes: ProductAttributeItem[];
}
```

## Implementation plan

1. Crear `core/models/attribute.model.ts` con `AttributeValue` y `AttributeWithValues`.
2. Crear `core/api/attributes.service.ts` con `findAllWithValues(filter)` → `GET /attributes/batch`.
3. Añadir a `core/models/product.model.ts` los tipos `ProductAttributeItem` y `CreateProduct`.
4. Añadir a `core/api/products.service.ts` el método `create(dto)` → `POST /products` (usar `unwrap` si la respuesta lo requiere).
5. Crear `products/pages/new-product.page.ts` con Reactive Forms: `baseProductId`, `stock`, `price`, y un `FormArray` de atributos (un control de valor por atributo, todos opcionales). Cargar base products (paginado con búsqueda) y atributos (batch). Validadores: `required`/`min` y la regla "al menos un atributo".
6. Crear `products/new-product.page.html`: select de base product con búsqueda, inputs de stock/precio, sección de atributos con sus valores, mensajes de error por campo, botón enviar, estados loading/error.
7. Enviar a `POST /products`; en éxito, toast y navegación al flujo de imágenes (SPEC 03) con el `productId`. En error, toast con el mensaje de la API.
8. En `products.page.html`, convertir el botón "Nuevo producto" en un enlace (RouterLink) a `/mantenimiento/productos/nuevo`.
9. Registrar la ruta hija `{ path: 'nuevo', data: { breadcrumb: 'Nuevo Producto' }, loadComponent, title: 'Nuevo Producto' }` en `mantenimiento.routes.ts`.
10. Añadir pruebas unitarias (Vitest): payload correcto de `CreateProduct`, validaciones de stock/precio/base, y regla de al menos un atributo.
11. Verificación: `ng build` + `npm run lint` + `ng test` + prueba manual contra la API local.

## Acceptance criteria

- [ ] `/mantenimiento/productos/nuevo` muestra el formulario con breadcrumb "Nuevo Producto".
- [ ] El botón "Nuevo producto" del listado es un enlace que navega a `/mantenimiento/productos/nuevo`.
- [ ] El select de base product permite buscar y paginar contra `GET /base-products`.
- [ ] Los atributos se cargan desde `GET /attributes/batch` y por cada uno se muestra su selector de valores.
- [ ] Se puede enviar el formulario solo con base product, stock y precio válidos, y al menos un atributo-valor.
- [ ] Enviar sin base product, con stock/precio `<= 0`, o sin ningún atributo muestra error de validación y no llama a la API.
- [ ] `POST /products` se llama con `{ stock, price, baseProductId, productAttributes: [{ attributeId, attributeValueId }] }`.
- [ ] En éxito, muestra toast y navega al flujo de imágenes (SPEC 03) conservando el `productId`.
- [ ] En error (400/404/409), muestra toast con el mensaje de la API y no navega.
- [ ] `ng build`, `npm run lint` y `ng test` pasan sin errores.

## Decisions

- **Sí:** Reactive Forms para el formulario (validadores claros y `FormArray` para atributos).
- **Sí:** `GET /attributes/batch` para cargar atributos con sus valores en una sola petición.
- **Sí:** select de base product con búsqueda/paginación (evita cargar todo el catálogo).
- **Sí:** atributos opcionales individualmente, pero exigir al menos uno en total (respeta `@ArrayNotEmpty` de la API sin modificar el contrato).
- **Sí:** validar en frontend base/stock/precio y al menos un atributo, replicando las reglas de la API.
- **Sí:** solo crear; editar queda para otro spec.
- **No:** modificar la API para permitir `productAttributes: []`.
- **No:** subida de imágenes aquí — SPEC 03.

## Risks

| Risk                                                           | Mitigation                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `POST /products` devuelve 409 por set de attributes duplicado  | Mostrar el mensaje de la API y dejar el formulario para corregir.  |
| Selector de base product grande degrada el rendimiento         | Paginación y búsqueda en el servidor (`GET /base-products`).       |
| Dependencia entre specs: navega a imágenes antes de que exista | `productId` se conserva; si SPEC 03 no está, redirigir al listado. |

## What is **not** in this spec

- Editar producto (`PATCH /products/:id`).
- Subida de imágenes (SPEC 03).
- Modificar el contrato de `POST /products` para atributos opcionales.

Cada uno de esos, si llega, va en su propio spec.
