# SPEC 07 — Página de atributos

> **Status:** Aprobado
> **Depends on:** API `ApiTienda` SPEC 04 (batch de `attributes` con UnitOfWork + tests del módulo)
> **Date:** 2026-09-05
> **Objective:** Añadir al frontend una pantalla de atributos con listado paginado y buscable, visualización responsive de valores mediante overlay y creación batch de atributos con sus valores usando Reactive Forms.

## Scope

**In:**

- Ruta `/mantenimiento/atributos` con breadcrumb, título y entrada en el menú de mantenimiento.
- Modelo frontend para atributos, valores de atributos, filtro paginado y payload de creación batch.
- Servicio frontend para consumir `GET /attributes/batch` y `POST /attributes/batch`.
- Listado paginado con tamaños `10`, `25` y `50`, iniciando en `10`.
- Búsqueda paginada por nombre mediante el parámetro `search`, reiniciando la página a `1` cuando cambia la búsqueda.
- Tabla con ID, nombre y valores de cada atributo.
- Visualización de los primeros `2` valores en pantallas pequeñas y hasta `5` valores en pantallas grandes.
- Acción para ver todos los valores cuando la cantidad exceda los valores visibles en el viewport actual.
- Overlay responsive mediante Angular CDK Dialog para mostrar la lista completa de valores.
- Diálogo de creación con Angular Reactive Forms y un `FormArray` para los valores.
- Creación mediante el payload exacto `{ name, values: [{ value }] }` de `POST /attributes/batch`.
- Validaciones de nombre y valores alineadas con el contrato de `ApiTienda`: texto no vacío, entre `1` y `50` valores y valores sin duplicados después de aplicar `trim`.
- Eliminación de filas de valores antes de guardar, sin permitir el envío cuando el arreglo queda vacío.
- Toasts existentes de `ngx-sonner` para creación exitosa, valores agregados, errores de creación y errores relevantes de consulta.
- Actualización local del listado después de crear o reutilizar correctamente un atributo, respetando la búsqueda activa y el tamaño de página.
- Estados de carga, listado vacío y error de consulta.
- Pruebas unitarias del servicio, página, diálogo de creación y overlay de valores.

**Out of scope (specs futuros):**

- Edición de atributos.
- Eliminación de atributos.
- Edición o eliminación de valores de atributos.
- Creación individual de atributos mediante `POST /attributes`.
- Gestión de relaciones entre atributos, valores y productos.
- Cambios al módulo de atributos o a los contratos de `ApiTienda`.
- Ordenamiento, importación, exportación o persistencia local de atributos.

## Data model

```ts
// src/app/core/models/attribute.model.ts
import { PaginationQuery } from './pagination.model';

export interface AttributeValue {
  id: number;
  value: string;
  attributeId: number;
}

export interface AttributeWithValues {
  id: number;
  name: string;
  values: AttributeValue[];
}

export interface CreateAttributeBatchValue {
  value: string;
}

export interface CreateAttributeBatch {
  name: string;
  values: CreateAttributeBatchValue[];
}

export interface AttributeFilter extends PaginationQuery {
  search?: string;
}

export interface AttributeBatchResult {
  attribute: AttributeWithValues;
  created: boolean;
}
```

```ts
// src/app/core/api/attributes.service.ts
findAllWithValues(filter: AttributeFilter): Observable<PaginatedResult<AttributeWithValues>>;
createWithValues(dto: CreateAttributeBatch): Observable<AttributeBatchResult>;
```

`AttributeBatchResult.created` es metadato calculado por el servicio a partir del status HTTP: `true` cuando `POST /attributes/batch` responde `201` y `false` cuando responde `200`. El cuerpo de ambas respuestas contiene el atributo con todos sus valores.

Convenciones:

- El frontend envía `name.trim()` y `value.trim()` en el payload.
- El nombre y cada valor deben contener texto después de aplicar `trim`.
- El formulario acepta como máximo `50` filas de valores, porque coincide con `@ArrayMaxSize(50)` del API.
- Los valores duplicados se comparan después de aplicar `trim`, respetando mayúsculas y minúsculas tal como lo hace la restricción del API.
- La respuesta de `POST /attributes/batch` es la fuente de verdad para actualizar o insertar el registro local.
- Cuando el atributo creado no coincide con la búsqueda activa, no se inserta en los datos visibles.
- Cuando el atributo nuevo coincide con la búsqueda activa, se coloca al inicio y el arreglo visible no supera `pageSize`.
- Cuando el atributo ya existía, se reemplaza su fila si está visible en la página actual; el total no se incrementa.
- No se utiliza localStorage, IndexedDB ni otra persistencia frontend.

## Implementation plan

1. Crear `src/app/core/models/attribute.model.ts` con los modelos de respuesta, payload batch y filtro paginado.
2. Crear `src/app/core/api/attributes.service.ts` con `findAllWithValues` y `createWithValues`, reutilizando `ApiService`, `ApiResponse`, `PaginatedResult` y `buildParams`; preservar el status HTTP del batch para calcular `created`.
3. Crear `AttributeSearch` en `src/app/feature/mantenimiento/attributes/components/attribute-search/` y `AttributeTable` en `src/app/feature/mantenimiento/attributes/components/attribute-table/`, usando componentes standalone y outputs para búsqueda y apertura del overlay.
4. Crear `AttributeValuesDialog` en `src/app/feature/mantenimiento/attributes/dialogs/attribute-values-dialog.ts` y `.html`, mostrando todos los valores del atributo y permitiendo cerrar con botón, Escape o clic fuera.
5. Crear `CreateAttributeDialog` en `src/app/feature/mantenimiento/attributes/dialogs/create-attribute-dialog.ts` y `.html` con Reactive Forms, `FormArray`, validaciones, alta y eliminación de filas, estado de envío y mensaje de error del API; mantener el diálogo abierto cuando falle la petición y mostrar también un toast.
6. Crear `AttributesPage` en `src/app/feature/mantenimiento/attributes/pages/attributes.page.ts` y `.html` para conectar búsqueda, servicio, tabla, diálogos, paginación compartida y estados de carga, vacío y error.
7. Implementar en `AttributesPage` la actualización local después de un batch exitoso, diferenciando el toast de atributo creado (`201`) del toast de valores agregados (`200`) y respetando el filtro y el límite activos.
8. Registrar `atributos` en `src/app/feature/mantenimiento/mantenimiento.routes.ts` y añadir **Atributos** al menú de `src/app/core/services/dashboard.service.ts`.
9. Añadir pruebas unitarias para URLs, parámetros, payloads y status del servicio; para las validaciones y errores del diálogo; para la actualización local, búsqueda, paginación y estados de la página; y para la apertura y cierre del overlay.
10. Ejecutar `npm run build` y `npm test` en `FrontTienda`, y probar manualmente la ruta, la búsqueda, la paginación, la visualización responsive de valores, el overlay, la creación de un atributo nuevo, la reutilización de un atributo existente y los errores del API.

## Acceptance criteria

- [ ] La ruta `/mantenimiento/atributos` carga sin errores.
- [ ] El menú de mantenimiento contiene **Atributos** y navega a la ruta correcta.
- [ ] La página solicita `GET /attributes/batch` con `page` y `limit`.
- [ ] La búsqueda envía `search` al API y reinicia la página a `1`.
- [ ] La paginación ofrece tamaños `10`, `25` y `50` e inicia en `10`.
- [ ] La tabla muestra ID, nombre y valores de cada atributo.
- [ ] En un viewport pequeño se muestran inicialmente como máximo los primeros `2` valores.
- [ ] En un viewport grande se muestran inicialmente como máximo los primeros `5` valores.
- [ ] Cuando existen valores ocultos, aparece una acción clickeable para ver todos.
- [ ] El overlay muestra todos los valores del atributo seleccionado.
- [ ] El overlay puede cerrarse mediante botón, Escape y clic fuera.
- [ ] La tabla muestra un estado vacío cuando el resultado no contiene atributos.
- [ ] La página muestra un estado de carga durante la consulta del listado.
- [ ] El diálogo de creación contiene un campo `name` y un `FormArray` de valores.
- [ ] El diálogo permite agregar múltiples valores y eliminar filas antes de guardar.
- [ ] El formulario bloquea el envío cuando `name` está vacío o contiene únicamente espacios.
- [ ] El formulario bloquea el envío cuando algún valor está vacío o contiene únicamente espacios.
- [ ] El formulario bloquea el envío cuando no hay valores.
- [ ] El formulario bloquea el envío cuando hay más de `50` valores.
- [ ] El formulario bloquea valores duplicados después de aplicar `trim`.
- [ ] La creación envía `POST /attributes/batch` con `{ name, values: [{ value }] }` y valores recortados.
- [ ] Una respuesta `201` muestra un toast de creación exitosa.
- [ ] Una respuesta `200` muestra un toast indicando que se agregaron valores al atributo existente.
- [ ] Después de un batch exitoso, la respuesta actualiza o inserta localmente el atributo sin superar `pageSize`.
- [ ] Un atributo que no coincide con la búsqueda activa no se inserta en los datos visibles.
- [ ] Un error de creación muestra un toast, muestra el mensaje dentro del diálogo y conserva los valores introducidos.
- [ ] Un error del listado muestra un mensaje de error y un toast sin romper la página.
- [ ] La pantalla no llama a endpoints de edición o eliminación.
- [ ] `npm run build` y `npm test` pasan sin errores en `FrontTienda`.

## Decisions

- **Sí:** usar `/mantenimiento/atributos` como ruta y añadir la entrada correspondiente al menú de mantenimiento.
- **Sí:** consumir `GET /attributes/batch` para recibir atributos junto con sus valores y reutilizar la paginación y búsqueda existentes del API.
- **Sí:** usar `POST /attributes/batch` como única operación de creación para enviar atributo y valores en una sola petición.
- **Sí:** preservar el status HTTP de la creación para distinguir `201` de `200` y comunicar correctamente si se creó el atributo o se agregaron valores.
- **Sí:** abrir el formulario de creación en un diálogo CDK, siguiendo el patrón de los mantenimientos existentes.
- **Sí:** usar Angular Reactive Forms y `FormArray`, porque es el mecanismo solicitado para gestionar una cantidad variable de valores.
- **Sí:** validar duplicados antes de enviar para evitar conflictos previsibles del API, sin cambiar el contrato backend.
- **Sí:** mostrar `2` valores en pantallas pequeñas y `5` en pantallas grandes; abrir un overlay cuando existan valores ocultos.
- **Sí:** actualizar el listado localmente después de crear, respetando búsqueda y `pageSize`, en lugar de ejecutar una consulta adicional.
- **Sí:** mostrar el error de creación mediante toast y mantener abierto el diálogo para permitir corregir o reintentar.
- **No:** crear un sistema nuevo de notificaciones; se reutiliza `ngx-sonner`.
- **No:** añadir edición o eliminación en esta spec; esos flujos requieren definir sus propias reglas de interacción e integridad.
- **No:** modificar `ApiTienda` ni crear una capa, store o abstracción adicional para la feature.

## Risks

| Risk                                                                                        | Mitigation                                                                                                |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| El batch responde `200` o `201` con el mismo cuerpo y el interceptor envuelve la respuesta. | Preservar el `HttpResponse`, desenvolver `ApiResponse.data` y derivar `created` desde el status HTTP.     |
| El API permite reutilizar un atributo existente y devolver todos sus valores.               | Reemplazar la fila local completa con la respuesta del API y no incrementar `total` en respuestas `200`.  |
| Una actualización local puede quedar fuera del orden real de una página paginada.           | Insertar solo al inicio, respetar `pageSize`, documentar el comportamiento y usar la respuesta del batch. |
| La cantidad visible depende del tamaño del viewport.                                        | Mantener los límites de `2` y `5` en la tabla y usar el overlay como acceso a la lista completa.          |
| Valores con espacios pueden producir duplicados o errores distintos entre frontend y API.   | Aplicar `trim` antes de validar y enviar, y conservar el mensaje del API si aun así existe un conflicto.  |

## What is **not** in this spec

- Edición de atributos.
- Eliminación de atributos.
- Edición o eliminación de valores.
- Gestión de atributos asociados a productos.
- Creación individual separada del atributo y sus valores.
- Cambios al backend `ApiTienda`.
- Importación, exportación, ordenamiento o persistencia local.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
