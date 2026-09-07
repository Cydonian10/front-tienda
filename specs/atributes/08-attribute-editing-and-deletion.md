# SPEC 08 — Edición y eliminación de atributos

> **Status:** Implementado
> **Depends on:** SPEC 07 (Página de atributos) y los endpoints existentes de `ApiTienda` para `attributes` y `attribute-values`.
> **Date:** 2026-09-06
> **Objective:** Extender la pantalla de atributos para editar su nombre y administrar individualmente sus valores, con confirmaciones de eliminación y actualización local del listado.

## Scope

**In:**

- Extender `src/app/core/models/attribute.model.ts` con los payloads de edición del atributo y creación o edición individual de valores.
- Extender `src/app/core/api/attributes.service.ts` para consumir `PATCH /attributes/:id`, `DELETE /attributes/:id`, `POST /attribute-values`, `PATCH /attribute-values/:id` y `DELETE /attribute-values/:id`.
- Añadir acciones **Editar** y **Eliminar** a `AttributeTable`, conservando las columnas, el comportamiento responsive de valores y el layout actual.
- Crear `EditAttributeDialog` en `src/app/feature/mantenimiento/attributes/dialogs/edit-attribute-dialog/` para editar un atributo ya cargado por el listado.
- Mantener en el modal un campo para renombrar el atributo, una lista completa desplazable de sus valores y un campo para agregar un valor individual.
- Permitir editar el texto de cada valor, agregar valores y eliminar valores individualmente sin cambiar su `attributeId`.
- Persistir cada operación de forma inmediata e independiente: guardar nombre, crear valor, editar valor o eliminar valor llama solo a su endpoint correspondiente.
- Mantener abierto el modal después de cada operación exitosa para seguir administrando el mismo atributo.
- Validar nombre y valores como texto no vacío después de `trim`.
- Bloquear la creación o edición de un valor que, después de `trim`, duplique otro valor del atributo.
- Permitir eliminar el último valor y dejar temporalmente el atributo sin valores.
- Reutilizar `ConfirmDialog` para pedir confirmación antes de borrar un atributo o un valor.
- Mostrar los errores de nombre, creación y edición de valores junto al control correspondiente y mediante `ngx-sonner`; mostrar los errores de eliminación mediante toast y conservar los datos locales cuando falle la operación.
- Actualizar localmente el atributo en `AttributesPage` sin volver a pedir el listado después de cerrar el modal con cambios.
- Quitar una fila visible y ajustar el total cuando un nuevo nombre deje de coincidir con la búsqueda activa.
- Eliminar localmente una fila después de borrar el atributo y, si era la única fila de una página posterior a la primera, volver a la página anterior para solicitar sus datos.
- Reutilizar el layout existente de `AttributesPage`, `AttributeTable`, `BreadcrumbsNg`, `PaginationNg`, `Icon` y `ConfirmDialog`.
- Añadir pruebas unitarias del servicio, la tabla, el modal de edición y los flujos nuevos de la página.

**Out of scope (specs futuros):**

- Cambios en controladores, DTOs, servicios, reglas de integridad o pruebas de `ApiTienda`.
- Eliminación en cascada de valores, atributos o referencias de productos.
- Mover un valor a otro atributo mediante `attributeId`.
- Crear o editar múltiples valores en una sola petición batch desde el modal de edición.
- Búsqueda, ordenamiento o paginación dentro del modal de edición.
- Cambios a la ruta, breadcrumb, menú de mantenimiento, creación batch, overlay de solo lectura o paginación principal definidos en SPEC 07.
- Restauración, historial, eliminación lógica, importación o exportación de atributos o valores.

## Data model

```ts
// src/app/core/models/attribute.model.ts
export interface Attribute {
  id: number;
  name: string;
}

export interface AttributeWithValues extends Attribute {
  values: AttributeValue[];
}

export interface UpdateAttribute {
  name: string;
}

export interface CreateAttributeValue {
  value: string;
  attributeId: number;
}

export interface UpdateAttributeValue {
  value: string;
}
```

```ts
// src/app/core/api/attributes.service.ts
update(id: number, dto: UpdateAttribute): Observable<Attribute>;
remove(id: number): Observable<void>;
createValue(dto: CreateAttributeValue): Observable<AttributeValue>;
updateValue(id: number, dto: UpdateAttributeValue): Observable<AttributeValue>;
removeValue(id: number): Observable<void>;
```

Convenciones:

- El frontend envía `name.trim()` y `value.trim()` en todos los payloads individuales.
- `UpdateAttributeValue` no expone `attributeId`, aunque el API lo admita, para que esta pantalla no mueva valores entre atributos.
- La respuesta de `PATCH /attributes/:id` contiene `{ id, name }` y se combina con los valores locales vigentes.
- Las respuestas de `POST /attribute-values` y `PATCH /attribute-values/:id` son la fuente de verdad para insertar o reemplazar el valor local.
- La eliminación no actualiza optimistamente: se quita el atributo o valor solo cuando `DELETE` responde correctamente.
- Los valores individuales no tienen un límite máximo en este modal, porque el contrato individual actual de `ApiTienda` no lo define; el límite de `50` continúa aplicando únicamente a la creación batch de SPEC 07.
- El modal recibe el `AttributeWithValues` de la fila seleccionada y devuelve su estado final solo si alguna operación se completó correctamente.
- No se introduce persistencia en localStorage, IndexedDB ni otra fuente local.

## Implementation plan

1. Extender `src/app/core/models/attribute.model.ts` con `Attribute`, `UpdateAttribute`, `CreateAttributeValue` y `UpdateAttributeValue`, manteniendo `AttributeWithValues` como el modelo de la tabla.
2. Extender `src/app/core/api/attributes.service.ts` con los cinco métodos individuales, sus URLs y payloads exactos; preservar el uso de `ApiService` y del contrato `ApiResponse` existente.
3. Actualizar `src/app/feature/mantenimiento/attributes/components/attribute-table/attribute-table.component.ts` y `.html` para añadir la columna **Acciones**, emitir los atributos seleccionados para editar o eliminar y conservar la acción de ver todos los valores.
4. Crear `src/app/feature/mantenimiento/attributes/dialogs/edit-attribute-dialog/edit-attribute-dialog.ts` y `.html` con controles reactivos independientes para el nombre, el alta de un valor y la edición de cada valor; mantener una lista desplazable, deshabilitar solo la operación en curso y conservar abierto el diálogo después de cada éxito.
5. Implementar en `EditAttributeDialog` el `PATCH /attributes/:id`, `POST /attribute-values` y `PATCH /attribute-values/:id`; validar texto recortado y duplicados antes de llamar al API, actualizar el estado del diálogo con cada respuesta y mostrar errores en el control afectado y mediante toast.
6. Implementar en `EditAttributeDialog` la eliminación de valores mediante `openConfirmDialog`; tras confirmación, llamar `DELETE /attribute-values/:id`, quitar el valor solo en éxito y permitir que el arreglo quede vacío.
7. Actualizar `src/app/feature/mantenimiento/attributes/pages/attributes.page.ts` y `.html` para abrir `EditAttributeDialog`, fusionar el atributo devuelto al cerrarse y actualizar la fila, valores y total locales según la búsqueda vigente; si el resultado queda vacío en una página posterior, cambiar a la página anterior para disparar la consulta existente.
8. Implementar en `AttributesPage` la eliminación de atributos: abrir `openConfirmDialog`, llamar `DELETE /attributes/:id` únicamente tras confirmación, quitar la fila y ajustar paginación solo cuando el API responda correctamente.
9. Añadir cobertura en `src/app/core/api/attributes.service.spec.ts`, crear las pruebas de `EditAttributeDialog` y `AttributeTable`, y extender `attributes.page.spec.ts` para los flujos de edición, valores, confirmaciones, búsqueda y paginación.

## Acceptance criteria

- [ ] La tabla de atributos muestra una columna **Acciones** con controles **Editar** y **Eliminar** para cada fila.
- [ ] La acción **Editar** abre un modal de edición independiente del diálogo de creación batch.
- [ ] El modal muestra el nombre actual, todos los valores actuales en una lista desplazable y un campo para agregar un valor.
- [ ] El modal permanece abierto después de crear, editar o eliminar correctamente un valor, y después de actualizar correctamente el nombre.
- [ ] Guardar un nombre válido envía `PATCH /attributes/:id` con `{ name: name.trim() }`.
- [ ] El formulario bloquea la actualización del nombre vacío o formado únicamente por espacios.
- [ ] Agregar un valor válido envía `POST /attribute-values` con `{ value: value.trim(), attributeId }`.
- [ ] Editar un valor válido envía `PATCH /attribute-values/:id` con `{ value: value.trim() }` y no envía `attributeId`.
- [ ] El formulario bloquea agregar o editar un valor vacío o formado únicamente por espacios.
- [ ] El formulario bloquea agregar o editar un valor que duplique, después de `trim`, otro valor del mismo atributo.
- [ ] Una respuesta exitosa al crear un valor lo añade al estado local del modal usando la respuesta del API.
- [ ] Una respuesta exitosa al editar un valor reemplaza solo ese valor en el estado local del modal usando la respuesta del API.
- [ ] El modal pide confirmación antes de llamar a `DELETE /attribute-values/:id`.
- [ ] Cancelar la confirmación de un valor no llama al API ni modifica la lista.
- [ ] Eliminar un valor correctamente lo quita del modal y permite que el atributo quede sin valores.
- [ ] El modal pide confirmación antes de llamar a `DELETE /attributes/:id`.
- [ ] Cancelar la confirmación del atributo no llama al API ni modifica la tabla.
- [ ] Un error `409` o cualquier error de eliminación muestra un toast y conserva el atributo o valor visible.
- [ ] Un error al guardar nombre, crear valor o editar valor muestra el mensaje del API junto al control afectado y mediante toast, sin descartar el texto ingresado.
- [ ] Al cerrar el modal después de operaciones exitosas, la fila del listado se actualiza localmente con el nombre y valores vigentes sin una nueva consulta de listado.
- [ ] Si el nuevo nombre ya no coincide con la búsqueda activa, la fila se quita del resultado local y el total disminuye.
- [ ] Si esa eliminación deja vacía una página posterior a la primera, la página cambia a la anterior y solicita sus datos.
- [ ] Eliminar un atributo correctamente lo quita del listado y disminuye el total local.
- [ ] La pantalla no llama a endpoints de `ApiTienda` para mover valores ni a un endpoint de eliminación en cascada.
- [ ] La ruta, menú, creación batch y overlay de valores definidos en SPEC 07 conservan su comportamiento actual.
- [ ] `npm run build` y `npm test` pasan sin errores en `FrontTienda`.

## Decisions

- **Sí:** editar el nombre del atributo y administrar sus valores de forma individual dentro de un nuevo modal de edición.
- **Sí:** mantener `CreateAttributeDialog` sin cambios funcionales para que la creación batch de SPEC 07 y la edición individual sigan siendo flujos separados.
- **Sí:** persistir cada acción inmediatamente con su endpoint individual, porque el API ya ofrece operaciones separadas y el usuario debe poder seguir gestionando el atributo después de cada éxito.
- **Sí:** mostrar la lista completa de valores en un contenedor desplazable, sin búsqueda ni paginación adicional dentro del modal.
- **Sí:** usar `ConfirmDialog` antes de borrar tanto el atributo como cada valor, porque ambas acciones son destructivas.
- **Sí:** permitir cero valores para poder retirar valores no usados antes de borrar un atributo.
- **Sí:** bloquear duplicados de valores después de `trim`, siguiendo la convención de creación batch y evitando conflictos previsibles del API.
- **Sí:** mantener el `attributeId` fijo durante la edición de valores para evitar transferencias que puedan afectar relaciones de productos.
- **Sí:** actualizar localmente la tabla al cerrar el modal con cambios y al eliminar una fila, usando las respuestas del API como fuente de verdad.
- **Sí:** quitar una fila que deje de coincidir con la búsqueda activa para que el resultado visible siga siendo consistente.
- **No:** modificar `ApiTienda`; los endpoints individuales requeridos ya existen.
- **No:** implementar eliminación en cascada ni eliminar automáticamente valores o referencias de productos cuando el API devuelva `409`.
- **No:** reutilizar el modal de creación batch para editar, porque su `FormArray` y límite de `50` responden a un contrato distinto.
- **No:** mover valores entre atributos aunque `PATCH /attribute-values/:id` admita `attributeId`.

## Risks

| Risk                                                                                                 | Mitigation                                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Un atributo no puede eliminarse mientras tenga valores o referencias.                                | Mostrar el mensaje `409`, conservar la fila y no realizar eliminación en cascada.                                                |
| Un valor referenciado por un producto no puede eliminarse.                                           | Mostrar el mensaje `409`, conservar el valor y permitir seguir gestionando los demás.                                            |
| Operaciones individuales simultáneas pueden duplicar solicitudes o sobrescribir el estado del modal. | Deshabilitar únicamente el control asociado a la operación en curso y actualizar el estado solo con su respuesta exitosa.        |
| Renombrar una fila puede invalidar la búsqueda activa y dejar vacía la página actual.                | Quitar la fila, actualizar el total y retroceder una página cuando corresponda.                                                  |
| Un valor puede cambiar en otra sesión mientras el modal está abierto.                                | Usar la respuesta del API en cada éxito, mostrar el error del API ante conflicto o inexistencia y no aplicar cambios optimistas. |

## What is **not** in this spec

- Cambios al backend `ApiTienda`.
- Eliminación en cascada de valores, atributos o relaciones de productos.
- Movimiento de valores entre atributos.
- Edición batch de valores desde el modal.
- Búsqueda o paginación interna de valores.
- Cambios a la creación batch, ruta, menú u overlay existentes.
- Historial, restauración, importación, exportación o persistencia local.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
