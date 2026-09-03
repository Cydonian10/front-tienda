# SPEC 06 — CRUD de unidades de medida

> **Status:** Aprobado
> **Depends on:** API `ApiTienda` SPEC 08 (CRUD de `measurement-units`)
> **Date:** 2026-09-02
> **Objective:** Añadir al frontend una pantalla de mantenimiento para listar, crear, editar y eliminar unidades de medida mediante un formulario modal reutilizable.

## Scope

**In:**

- Nueva ruta `/mantenimiento/unidades-medida`.
- Modelo `MeasurementUnit`, payloads de creación y actualización, y filtro paginado en `src/app/core/models/measurement-unit.model.ts`.
- `MeasurementUnitsService` en `src/app/core/api/measurement-units.service.ts` para consumir:
  - `GET /measurement-units` con `page`, `limit` y `search`.
  - `POST /measurement-units`.
  - `PATCH /measurement-units/:id`.
  - `DELETE /measurement-units/:id`.
- Página `src/app/feature/mantenimiento/measurement-units/pages/measurement-units.page.ts` y `.html`.
- Componente `MeasurementUnitsSearch` en `measurement-units/components/measurement-units-search/`.
- Componente `MeasurementUnitsTable` en `measurement-units/components/measurement-units-table/` con columnas ID, nombre, valor y acciones.
- Diálogo `MeasurementUnitDialog` en `measurement-units/dialogs/measurement-unit-dialog.ts` y `.html`.
- Uso de Signal Forms para el formulario de creación y edición.
- Validación frontend de `name` y `value` obligatorios y no vacíos después de aplicar trim.
- Validación frontend de `value` con un máximo de 5 caracteres, alineada con el API.
- Edición mediante el mismo modal reutilizable, abierto desde la acción **Editar** de la tabla.
- Eliminación desde la tabla con diálogo de confirmación.
- Mensajes de éxito mediante toast y mensajes de error del API dentro del modal o del listado correspondiente.
- Actualización local de la página actual después de crear, editar o eliminar correctamente.
- Al eliminar el último registro de una página distinta de la primera, volver a la página anterior y solicitar sus datos al API.
- Reutilización de `src/app/shared/pagination/pagination.ng.ts` con tamaños `10`, `25` y `50`, iniciando en `10`.
- Nueva entrada **Unidades de medida** en `src/app/core/services/dashboard.service.ts`.
- Nueva ruta hija en `src/app/feature/mantenimiento/mantenimiento.routes.ts` con breadcrumb y título `Unidades de medida`.
- Pruebas unitarias para el servicio, el diálogo y los flujos principales de la página.

**Out of scope (specs futuros):**

- Cambios al contrato o a la implementación de `ApiTienda` SPEC 08.
- Búsqueda local en memoria; la búsqueda será paginada mediante el parámetro `search` del API.
- Búsqueda por `value`; el contrato existente del API busca únicamente sobre `name`.
- Gestión de unidades asociadas a un `base-product` bajo `/base-products/:baseProductId/units`.
- Conversión automática de cantidades usando `factor`.
- Ordenamiento, priorización o reordenamiento de unidades.
- Eliminación lógica, restauración o historial de unidades.
- Importación o exportación masiva.

## Data model

```ts
// src/app/core/models/measurement-unit.model.ts
import { PaginationQuery } from './pagination.model';

export interface MeasurementUnit {
  id: number;
  name: string;
  value: string;
}

export interface CreateMeasurementUnit {
  name: string;
  value: string;
}

export interface UpdateMeasurementUnit {
  name?: string;
  value?: string;
}

export interface MeasurementUnitFilter extends PaginationQuery {
  search?: string;
}
```

El listado reutiliza `PaginatedResult<MeasurementUnit>` de `src/app/core/models/pagination.model.ts`.

Convenciones:

- El frontend envía `name.trim()` y `value.trim()` en los payloads.
- El formulario exige que ambos valores contengan texto después del trim.
- `value` no puede superar 5 caracteres.
- Los duplicados de `name` o `value` se resuelven mostrando el mensaje de conflicto devuelto por el API.
- La respuesta del API es la fuente de verdad para actualizar o insertar el registro en el estado local.
- La búsqueda reinicia la página a `1` y usa únicamente el campo `search` del endpoint paginado.

## Implementation plan

1. Crear `src/app/core/models/measurement-unit.model.ts` con los modelos `MeasurementUnit`, `CreateMeasurementUnit`, `UpdateMeasurementUnit` y `MeasurementUnitFilter`.
2. Crear `src/app/core/api/measurement-units.service.ts` con los métodos `findAll`, `create`, `update` y `remove`, reutilizando `ApiService`, `ApiResponse` y `PaginatedResult`.
3. Crear `MeasurementUnitsSearch` como componente standalone con un output para el texto de búsqueda y un campo accesible de tipo búsqueda.
4. Crear `MeasurementUnitsTable` como componente standalone con inputs para los registros y outputs para **Editar** y **Eliminar**; mostrar estado vacío cuando no existan registros.
5. Crear `MeasurementUnitDialog` con Signal Forms, modo creación/edición según los datos recibidos, estados de envío, validaciones y manejo de errores del API; cerrar el diálogo únicamente después de una operación exitosa.
6. Crear `MeasurementUnitsPage` para conectar búsqueda, servicio, tabla, diálogo y paginación compartida; mantener `page`, `pageSize` y el resultado paginado en señales.
7. Implementar en la página la actualización local tras crear, editar y eliminar; cuando la eliminación deje vacía una página no inicial, ajustar a la página anterior y volver a consultar.
8. Registrar `/mantenimiento/unidades-medida` en `mantenimiento.routes.ts` y añadir **Unidades de medida** al menú de `DashboardService`.
9. Añadir pruebas unitarias del servicio para URLs, parámetros, payloads y errores; del diálogo para validaciones, creación, edición y conflictos; y de la página para búsqueda, paginación, actualización local y eliminación de la última fila.
10. Verificar con `npm run build` y `npm test` en `FrontTienda`, y comprobar manualmente listar, buscar por nombre, paginar, crear, editar, eliminar y mostrar errores de duplicidad o referencias.

## Acceptance criteria

- [ ] La ruta `/mantenimiento/unidades-medida` carga sin errores.
- [ ] El menú de mantenimiento contiene **Unidades de medida** y navega a la ruta correcta.
- [ ] La página solicita `GET /measurement-units` con `page` y `limit`.
- [ ] El buscador envía `search` al API y reinicia la página a `1`.
- [ ] El listado muestra ID, nombre, valor y acciones para cada unidad.
- [ ] El listado muestra un estado vacío cuando la respuesta no contiene registros.
- [ ] La paginación reutiliza `ng-pagination` con tamaños `10`, `25` y `50`.
- [ ] El modal de creación muestra los campos `name` y `value`.
- [ ] El modal no permite enviar cuando `name` está vacío o contiene únicamente espacios.
- [ ] El modal no permite enviar cuando `value` está vacío o contiene únicamente espacios.
- [ ] El modal no permite enviar un `value` con más de 5 caracteres.
- [ ] Crear una unidad envía `POST /measurement-units` con los valores recortados.
- [ ] Tras crear correctamente, el modal se cierra, aparece un toast y la unidad aparece en el estado local.
- [ ] La acción **Editar** abre el mismo modal con los valores actuales de la unidad.
- [ ] Editar una unidad envía `PATCH /measurement-units/:id` con los valores recortados.
- [ ] Tras editar correctamente, el modal se cierra, aparece un toast y la fila se reemplaza con la respuesta del API.
- [ ] La acción **Eliminar** solicita confirmación antes de llamar al API.
- [ ] Cancelar la confirmación no elimina la unidad.
- [ ] Tras eliminar correctamente, aparece un toast y la unidad desaparece del estado local.
- [ ] Si se elimina la última fila de una página posterior, la página se ajusta a la anterior y se consultan sus datos.
- [ ] Los errores de validación o conflicto del API se muestran sin cerrar el modal ni perder los valores introducidos.
- [ ] Los errores de eliminación se muestran mediante toast y conservan el registro en la tabla.
- [ ] La página muestra un estado de carga mientras consulta el listado.
- [ ] `npm run build` y `npm test` pasan sin errores en `FrontTienda`.

## Decisions

- **Sí:** usar `/mantenimiento/unidades-medida` y la carpeta `measurement-units`, porque identifica el recurso sin confundirlo con las unidades asociadas a productos base.
- **Sí:** consumir el API existente de `ApiTienda` SPEC 08, sin modificar el backend.
- **Sí:** usar búsqueda paginada del API en lugar de cargar todas las unidades para filtrar localmente.
- **Sí:** buscar únicamente por `name`, porque es el comportamiento definido por el contrato actual del API.
- **Sí:** reutilizar `ng-pagination` en lugar de duplicar un componente de paginación dentro de la feature.
- **Sí:** separar la página, el buscador y la tabla en componentes, y reutilizar un único diálogo para crear y editar.
- **Sí:** usar Signal Forms para el formulario, según el requerimiento funcional.
- **Sí:** actualizar el listado localmente tras operaciones exitosas y usar la respuesta del API como fuente de verdad.
- **Sí:** confirmar la eliminación antes de llamar a `DELETE`.
- **Sí:** ajustar la página después de eliminar el último registro visible para no dejar al usuario en una página vacía innecesaria.
- **No:** crear una pantalla separada para editar; el mismo modal cubre creación y edición.
- **No:** filtrar localmente ni buscar por `value`; ambos comportamientos requieren un contrato distinto o una estrategia de carga diferente.
- **No:** incluir en esta pantalla la gestión de unidades de `base-products`; ese flujo pertenece al contrato anidado de SPEC 08 y a otra feature.

## Risks

| Risk                                                                                     | Mitigation                                                                                                          |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Un `name` o `value` duplicado es rechazado por el API.                                   | Mostrar el mensaje 409 dentro del modal y conservar el formulario abierto.                                          |
| Eliminar una unidad referenciada por un producto base devuelve 409.                      | Mostrar el error mediante toast y mantener la fila en el listado.                                                   |
| La actualización local puede dejar menos filas que el tamaño de página.                  | Reconsultar la página anterior cuando la página eliminada queda vacía.                                              |
| El debounce del buscador puede producir solicitudes fuera de orden.                      | Encadenar las consultas mediante el patrón reactivo existente y conservar solo el resultado de la búsqueda vigente. |
| La implementación de Signal Forms puede diferir de los formularios reactivos existentes. | Mantener el diálogo aislado y cubrir validaciones, payloads y estados de envío con pruebas unitarias.               |

## What is **not** in this spec

- Cambios en `ApiTienda` o en el contrato de measurement-units.
- Búsqueda local o búsqueda por `value`.
- Gestión de unidades por `base-product`.
- Conversión mediante `factor`.
- Ordenamiento o priorización de unidades.
- Eliminación lógica, restauración, importación o exportación masiva.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
