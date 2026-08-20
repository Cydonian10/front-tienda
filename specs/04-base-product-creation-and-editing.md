# SPEC 04 — Creación y edición de producto base con stock/precio y producto default

> **Status:** Draft
> **Depends on:** SPEC 01 (página de productos base), SPEC 02 (crear producto), SPEC 03 (imágenes de producto), API `ApiTienda` SPEC 05 (base-products) y contrato `PATCH /base-products/:id` ya ampliado.
> **Date:** 2026-08-19
> **Objective:** Extender el alta de producto base con campos obligatorios de stock y precio iniciales, mostrar tras crear una tarjeta con el producto default generado y un enlace al menú de Productos para crear variantes, y añadir la edición de nombre, marca, categorías y unidades del base-product.

## Scope

**In:**

- Modelo `CreateBaseProduct` en `src/app/core/models/base-product.model.ts` con `initialStock` e `initialPrice` obligatorios.
- Modelo `UpdateBaseProduct` y `BaseProductUnit` reutilizado para el payload de edición.
- Modelo `DefaultProduct` en `src/app/core/models/base-product.model.ts` (mapeo del `defaultProduct` que retorna `POST /base-products`).
- `BaseProductsService.update(id, dto)` en `src/app/core/api/base-products.service.ts` → `PATCH /base-products/:id`.
- `BaseProductsService.create(dto)` ya existe y retorna `defaultProduct`; se tipa correctamente.
- `new-base-product.page.ts` + `.html`:
  - Campos numéricos `stock` y `precio` obligatorios (mínimo 0), con validación frontend.
  - Tras crear, permanecer en la pantalla y mostrar una tarjeta de confirmación con nombre, stock y precio del producto default creado, más un enlace al menú general de Productos (`/mantenimiento/productos`) para crear variantes.
- `base-products.page.html` + `.ts`: acción **Editar** por fila que navega a `/mantenimiento/base-products/:id/editar`.
- Nueva página `feature/mantenimiento/base-products/pages/edit-base-product.page.ts` + `.html`:
  - Carga el base-product con `GET /base-products/:id/detail`.
  - Formulario con nombre, marca, categorías y unidades (reutiliza `BaseProductGeneralData`, `BaseProductCategoriesPicker`, `BaseProductUnitsEditor`).
  - Envío a `PATCH /base-products/:id`; estados loading/error/success con toast y navegación al listado.
- Ruta hija `:id/editar` en `mantenimiento.routes.ts`.
- Pruebas unitarias (Vitest) para payloads de creación y edición, y validaciones de stock/precio.

**Out of scope (specs futuros):**

- Edición de stock y precio del producto default desde este formulario (la API no los expone en `PATCH /base-products/:id`).
- Eliminación de base-products (ya existe acción en el listado).
- Filtro visual por `baseProductId` en el listado de productos.
- Vista de detalle dedicada del base-product.

## Data model

```ts
// src/app/core/models/base-product.model.ts (modificar)
export interface CreateBaseProductUnit {
  unitId: number;
  factor: number;
  isMain: boolean;
}

export interface CreateBaseProduct {
  name: string;
  units: CreateBaseProductUnit[];
  brandId?: number | null;
  categoryIds?: number[];
  initialStock: number;   // obligatorio, Min(0)
  initialPrice: number;   // obligatorio, Min(0)
}

export interface DefaultProduct {
  id: number;
  name: string;
  stock: number;
  price: number;
  baseProductId: number;
}

export interface CreateBaseProductResponse {
  baseProduct: BaseProduct;
  defaultProduct: DefaultProduct;
}

export interface UpdateBaseProduct {
  name?: string;
  brandId?: number | null;
  categoryIds?: number[];
  units?: CreateBaseProductUnit[];
}
```

## Implementation plan

1. Extender `core/models/base-product.model.ts`: añadir `initialStock`/`initialPrice` a `CreateBaseProduct`, definir `DefaultProduct` y tipar `CreateBaseProductResponse.defaultProduct`; añadir `UpdateBaseProduct`.
2. Añadir `BaseProductsService.update(id, dto)` → `PATCH /base-products/:id` en `core/api/base-products.service.ts`.
3. En `new-base-product.page.ts`: añadir controles `initialStock` e `initialPrice` al form; incluir en el DTO; tras `create`, guardar `defaultProduct` en una señal y no navegar. En `new-base-product.page.html`: inputs numéricos y tarjeta de éxito con nombre/stock/precio y enlace a `/mantenimiento/productos`.
4. En `base-products.page.html`: añadir botón **Editar** por fila; en `.ts` implementar `onEdit(baseProduct)` que navega a `editar/:id`.
5. Crear `edit-base-product.page.ts` + `.html`: cargar detalle con `findDetail(id)`, poblar formulario (nombre, marca, categorías, unidades), validar y enviar con `update`.
6. Registrar ruta `{ path: ':id/editar', data: { breadcrumb: 'Editar Producto Base' }, loadComponent, title: 'Editar Producto Base' }` en `mantenimiento.routes.ts`.
7. Añadir pruebas unitarias (Vitest): payload de `CreateBaseProduct` con stock/precio, `UpdateBaseProduct` con unidades, y validaciones.
8. Verificación: `ng build` + `ng test` + revisión de payloads + prueba manual de crear y editar contra la API local.

## Acceptance criteria

- [ ] `CreateBaseProduct` incluye `initialStock` e `initialPrice` y el formulario los exige (mínimo 0).
- [ ] `POST /base-products` se envía con `name`, `units`, `brandId`, `categoryIds`, `initialStock` e `initialPrice`.
- [ ] Tras crear, la pantalla muestra una tarjeta con nombre, stock y precio del `defaultProduct`.
- [ ] La tarjeta de éxito enlaza al menú general `/mantenimiento/productos`.
- [ ] Tras crear no se navega automáticamente al listado (permanece para ver la tarjeta).
- [ ] El listado de base-products tiene una acción **Editar** por fila.
- [ ] `Editar` navega a `/mantenimiento/base-products/:id/editar`.
- [ ] La página de edición carga el base-product con `GET /base-products/:id/detail`.
- [ ] El formulario de edición permite cambiar nombre, marca, categorías y unidades.
- [ ] `PATCH /base-products/:id` se llama con los campos modificados.
- [ ] En error de edición/creación se muestra toast con el mensaje de la API y no se navega.
- [ ] En éxito de edición se muestra toast y se navega al listado.
- [ ] `ng build` y `ng test` pasan sin errores.

## Decisions

- **Sí:** campos stock/precio obligatorios con mínimo 0, alineados a la API.
- **Sí:** permanecer en la pantalla tras crear y mostrar tarjeta de confirmación (no navegar al listado).
- **Sí:** enlazar al menú general de Productos (sin filtro por baseProductId todavía).
- **Sí:** acción Editar en el listado, ruta `:id/editar`.
- **Sí:** editar nombre, marca, categorías y unidades vía `PATCH /base-products/:id` (contrato ya ampliado en la API).
- **No:** editar stock/precio del producto default desde este spec (la API no lo expone).
- **No:** filtro visual por baseProductId en productos (otro spec si llega).

## Risks

| Risk                                              | Mitigation                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `PATCH` con unidades inválidas devuelve 400/404   | Validar en frontend igual que en creación y mostrar mensaje de la API.  |
| Conflicto de nombre duplicado en edición          | Mostrar el mensaje 409 de la API y mantener el formulario.             |
| El `defaultProduct` no coincide con lo mostrado   | Mapear directamente el `defaultProduct` de la respuesta de `create`.    |

## What is **not** in this spec

- Edición de stock/precio del producto default.
- Filtro visual por `baseProductId` en productos.
- Vista de detalle dedicada del base-product.
- Eliminación de base-products (ya existe).

Cada uno de esos, si llega, va en su propio spec.
