# SPEC 05 — Edición de productos

> **Status:** Implementado
> **Depends on:** SPEC 01 (listado de productos), SPEC 02 (creación de productos), API `ApiTienda` SPEC 06 (CRUD de products), API `ApiTienda` SPEC 15 (eliminación de `product.name`).
> **Date:** 2026-08-23
> **Objective:** Añadir la edición de stock, precio y atributos de un producto mediante `PATCH /products/:id`, incluyendo el orden de los atributos en el mismo guardado y permitiendo dejar el producto sin atributos.

## Scope

**In:**

- Contrato de actualización de `ApiTienda`:
  - `PATCH /products/:id` permite `productAttributes: []`.
  - `POST /products` conserva la exigencia de al menos un atributo.
  - `productAttributes` del PATCH general conserva `attributeId`, `attributeValueId` y `order`.
  - El PATCH general reemplaza el conjunto completo de atributos cuando el campo está presente.
- Modelo y `ProductsService` en `FrontTienda` para:
  - `findOne(id)` → `GET /products/:id`.
  - `update(id, dto)` → `PATCH /products/:id`.
- Página `src/app/feature/mantenimiento/products/pages/edit/edit-product.page.ts` y `.html`:
  - Carga el producto por id.
  - Permite editar stock y precio.
  - Permite agregar, quitar y cambiar valores de atributos reutilizando `ProductAttributesEditor`.
  - Permite reordenar atributos con drag & drop.
  - No muestra un campo editable para `baseProductId` ni para `name`.
  - Envía una sola petición general al pulsar Guardar.
  - Envía `productAttributes` completo cuando cambian los atributos o su orden.
  - Envía solo stock y precio cuando los atributos no cambiaron.
  - Permite guardar cero atributos.
  - Actualiza el formulario con la respuesta del PATCH.
  - Muestra estados de carga, error, guardado y éxito mediante toast.
  - Navega al listado solo después de un guardado exitoso.
- Ruta hija `:id/editar` en `src/app/feature/mantenimiento/mantenimiento.routes.ts`.
- Acción **Editar** por fila en el listado de productos.
- Pruebas unitarias para los payloads del servicio, la inicialización del formulario, la edición sin atributos y el envío del orden dentro del PATCH general.
- Pruebas unitarias de `ApiTienda` para aceptar un arreglo vacío en `UpdateProductDto` y actualizar el producto sin atributos.

**Out of scope (specs futuros):**

- Uso de `PATCH /products/:id/attribute-orders` desde esta pantalla.
- Guardado inmediato del orden al soltar un atributo.
- Edición de `baseProductId`.
- Edición de `name`; `Product` ya no tiene nombre propio y la respuesta usa `baseProductName`.
- Edición de imágenes del producto.
- Eliminación de productos desde la pantalla de edición.
- Cambios al contrato de creación para permitir productos sin atributos.

## Data model

```ts
// FrontTienda/src/app/core/models/product.model.ts
export interface UpdateProduct {
  stock?: number;
  price?: number;
  productAttributes?: ProductAttributeItem[];
}

export interface ProductAttributeItem {
  attributeId: number;
  attributeValueId: number;
  order: number;
}
```

```ts
// FrontTienda/src/app/core/api/products.service.ts
findOne(id: number): Observable<Product>;
update(id: number, dto: UpdateProduct): Observable<Product>;
```

```ts
// ApiTienda/src/modules/products/dtos/product/update-product.dto.ts
// productAttributes es opcional y, cuando se envía, puede ser [];
// cada elemento conserva attributeId, attributeValueId y order.
```

Convenciones:

- El orden se modifica localmente durante el drag & drop y se persiste al pulsar Guardar.
- Si solo cambia el orden, el PATCH general envía el arreglo completo de `productAttributes`.
- Si el PATCH falla, la página conserva el formulario para permitir corregir o reintentar.
- La respuesta de cada PATCH exitoso es la fuente de verdad para actualizar el estado local.
- `baseProductName`, `stockLabel` y `units` se muestran como datos recibidos y no son editables en esta spec.

## Implementation plan

1. En `ApiTienda`, ajustar `UpdateProductDto` para aceptar `productAttributes: []` sin modificar la validación de `CreateProductDto`; añadir la cobertura unitaria correspondiente.
2. En `ApiTienda`, verificar que `ProductsService.update` borra los atributos existentes, permite guardar ninguno, actualiza `attributeKey` vacío y devuelve el producto actualizado dentro de la transacción; añadir el caso unitario de edición sin atributos.
3. En `FrontTienda`, añadir `UpdateProduct` y los métodos `findOne`/`update` a `core/models/product.model.ts` y `core/api/products.service.ts`.
4. Crear `products/pages/edit/edit-product.page.ts` con carga del producto y de las opciones de atributos, formulario de stock/precio, mapeo de atributos existentes y detección de cambios.
5. Crear `products/pages/edit/edit-product.page.html` reutilizando `ProductInventoryFields` y `ProductAttributesEditor`, con controles de guardar/cancelar, validación de cero o más atributos y estados visuales.
6. Registrar `:id/editar` en `mantenimiento.routes.ts` y añadir la acción **Editar** en `ProductsTable`; conectar la navegación desde `ProductsPage`.
7. Implementar el guardado: enviar solo los campos generales modificados, incluir el arreglo completo de atributos cuando cambien sus valores o su orden, mapear la respuesta del PATCH y navegar al listado únicamente en éxito.
8. Añadir pruebas unitarias de `ProductsService`, de la página de edición y de los escenarios de atributos vacíos, cambios de orden, errores y guardado sin cambios.
9. Verificación final: ejecutar `npm run build` y `npm test` en `FrontTienda`; ejecutar `npm run build`, `npm run lint` y `npm test` en `ApiTienda`; probar manualmente cargar, editar, reordenar, eliminar todos los atributos y cancelar.

## Acceptance criteria

- [ ] La ruta `/mantenimiento/productos/:id/editar` carga la página de edición.
- [ ] El listado muestra una acción **Editar** por producto.
- [ ] La página carga el producto con `GET /products/:id`.
- [ ] El formulario permite cambiar stock y precio con las validaciones actuales de valores mayores a cero.
- [ ] El formulario no permite cambiar `baseProductId` ni `name`.
- [ ] El formulario permite agregar, quitar y cambiar valores de atributos.
- [ ] El formulario permite reordenar atributos con drag & drop.
- [ ] El botón Guardar no llama a la API cuando no existen cambios.
- [ ] Si solo cambia stock o precio, `PATCH /products/:id` no envía `productAttributes`.
- [ ] Si cambian los valores o el orden, `PATCH /products/:id` envía el arreglo completo con `attributeId`, `attributeValueId` y `order`.
- [ ] Si el usuario elimina todos los atributos, `PATCH /products/:id` acepta `productAttributes: []` y el producto queda sin atributos.
- [ ] `POST /products` continúa rechazando un arreglo vacío de atributos.
- [ ] La pantalla actualiza sus datos con la respuesta del PATCH exitoso.
- [ ] Un error del PATCH muestra el mensaje de la API y mantiene al usuario en la pantalla.
- [ ] Tras un guardado exitoso se muestra un toast y se navega a `/mantenimiento/productos`.
- [ ] Esta pantalla no llama a `PATCH /products/:id/attribute-orders`.
- [ ] `npm run build` y `npm test` pasan en `FrontTienda`.
- [ ] `npm run build`, `npm run lint` y `npm test` pasan en `ApiTienda`.

## Decisions

- **Sí:** usar `PATCH /products/:id` como única petición de guardado de esta pantalla.
- **Sí:** enviar el orden junto con el reemplazo completo de `productAttributes` al guardar.
- **Sí:** permitir cero atributos únicamente durante la edición.
- **Sí:** conservar el requisito de al menos un atributo durante la creación.
- **Sí:** reutilizar `ProductAttributesEditor`, `ProductInventoryFields` y los modelos existentes.
- **Sí:** mantener `baseProductId` y `name` fuera de los campos editables.
- **Sí:** no llamar a la API si el formulario no tiene cambios.
- **Sí:** usar la respuesta del PATCH como fuente de verdad para el estado local.
- **No:** usar `PATCH /products/:id/attribute-orders` en esta pantalla; queda para otra spec si se necesita una edición independiente del orden.
- **No:** permitir cambiar el producto base desde la edición.
- **No:** reintroducir `product.name` ni crear un nombre calculado.

## Risks

| Risk                                                                                                 | Mitigation                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| El PATCH general reemplaza todos los atributos y puede eliminar datos si el payload está incompleto. | Construir el payload desde el estado completo del `FormArray` y probar cambios de valores, orden y eliminación total. |
| Un error durante el guardado puede dejar al usuario con datos locales distintos del servidor.        | No navegar ante errores, conservar el formulario y usar la respuesta completa del PATCH cuando sea exitoso.           |
| El cambio de validación para `PATCH` puede confundirse con la validación de creación.                | Ajustar únicamente `UpdateProductDto` y mantener `ArrayNotEmpty` en `CreateProductDto`, con pruebas para ambos casos. |
| El orden visual puede perderse al mapear la respuesta.                                               | Mapear siempre el campo `order` y ordenar las filas según el orden recibido antes de mostrar el formulario.           |

## What is **not** in this spec

- Uso de `PATCH /products/:id/attribute-orders`.
- Guardado inmediato del orden al soltar un atributo.
- Cambio de producto base o de nombre.
- Edición de imágenes.
- Eliminación de productos desde la pantalla de edición.
- Productos sin atributos durante la creación.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
