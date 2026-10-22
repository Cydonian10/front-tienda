# SPEC 08 — Interfaz real de movimientos de inventario

> **Status:** Draft
> **Depends on:** SPEC 07
> **Date:** 2026-10-21
> **Objective:** Sustituir la simulación de movimientos por formularios que registren salidas, traslados y ajustes reales en la API.

## Why this spec exists

`src/app/inventario/pages/movimientos/movimientos-page.ts` valida almacenes, variantes, factores y saldos de demostración; su confirmación no escribe en la API. SPEC 07 proporciona los contratos y reglas de inventario necesarios para convertir las rutas existentes en operaciones reales.

## Scope

**In:**

- Conservar `/admin/inventario/movimientos/salida`, `/traslado` y `/ajuste`, pero exigir `MOVIMIENTOS_LEER` para abrirlas y mostrar su entrada en el menú.
- Sustituir almacenes, variantes, unidades, factores y saldos ficticios por datos de SPEC 07. Buscar variantes remotamente por nombre o SKU desde dos caracteres, con paginación y selección mediante teclado.
- Mostrar saldos y equivalencia en unidad base; pedir costo obligatorio por unidad base al aumentar stock con un ajuste. Impedir seleccionar la misma variante dos veces.
- Permitir registrar solo con el permiso de escritura del tipo elegido, comprobado al ejecutar la acción además de ocultar o deshabilitar el botón.
- Diferenciar estados de carga, vacío, error recuperable, envío y confirmación. Mantener el formulario ante rechazo o fallo de red; tras éxito mostrar el ID, limpiar filas y conservar tipo y almacén.
- Crear y ejecutar pruebas automatizadas de HTTP, acciones, rutas y página, y verificar la compilación de Angular.

**Out of scope (for future specs):**

- Historial, detalle, edición y anulación de movimientos.
- Guardar borradores en el navegador o modificar la página de Compras.

## Data model

- `src/app/api/interfaces/inventario/movimiento.interface.ts` refleja los contratos de `GET /api/movimientos/almacenes`, `GET /api/movimientos/variantes` y `POST /api/movimientos`; cantidades, factores y costos permanecen como cadenas decimales.
- `src/app/api/inventario/movimiento-api.ts` encapsula las tres llamadas. `src/app/inventario/actions/use-movimientos-action.ts` incorpora consultas con claves que incluyen tipo, almacén, término, página y límite, más una mutación `injectMutation` para registrar e invalidar las existencias y opciones afectadas tras éxito.
- `movimientos-page.ts` conserva con señales el tipo de ruta, almacenes elegidos, motivo, líneas, búsqueda y estados de confirmación/error. Cada intento de escritura recibe un UUID `idempotenciaClave`. Ante un error de red con resultado incierto se conservan la clave y **el mismo contenido** para reintentar; no se permite alterar ese envío pendiente hasta obtener una respuesta definitiva. Ante un error de validación que garantiza rechazo se puede corregir y generar una clave nueva.
- Cada fila conserva un ID local para la vista, `varianteId`, `unidadId`, `cantidad` y, solo para ajuste positivo, `costoUnitarioBase`. Se eliminan los IDs, la unidad `caja = 10` y los saldos de `movimiento-demo.model.ts` como fuentes de verdad de esta pantalla.

## Implementation plan

1. Añadir contratos, cliente HTTP y pruebas en `src/app/api/interfaces/inventario/` y `src/app/api/inventario/`; dejar las rutas actuales funcionales durante la adaptación.
2. Añadir consultas y mutación TanStack Query en `src/app/inventario/actions/`, con pruebas de claves, invalidación selectiva y reintentos.
3. Sustituir el permiso de rutas en `src/app/inventario/inventario.routes.ts` y el permiso de su enlace en `src/app/system-portal/services/control-access/system-menu.service.ts`; actualizar las pruebas de guard y menú sin cambiar la redirección a salida.
4. Adaptar `components/datos-movimiento.ts` y `.html` para almacenes reales; mostrar carga, lista vacía y error con reintento.
5. Adaptar `components/detalle-movimiento.ts` y `.html` para búsqueda remota paginada, selección con teclado, unidades reales, saldo del origen y costo de ajuste positivo; cubrir estados y filas duplicadas con pruebas.
6. Conectar `movimientos-page.ts` y `.html` a la mutación: validar el formulario, comprobar permiso por tipo, impedir doble envío y gestionar el reintento con la misma clave tras fallo incierto. Confirmar con ID y restablecer solo líneas y motivo; probar éxito, rechazo y fallo de red.
7. Retirar mensajes de simulación y usos de `movimiento-demo.model.ts` en la pantalla; eliminar ese archivo solo cuando ya no tenga consumidores. Ejecutar las pruebas relevantes y `npm run build` en `front-tienda`.

## Acceptance criteria

- [ ] Las tres rutas muestran almacenes, variantes, unidades, factores y saldos de la API, sin etiquetas ni confirmaciones de simulación.
- [ ] Desde la interfaz se registra una salida, un traslado y ajustes positivo y negativo; sus formularios envían el contrato de SPEC 07.
- [ ] Con solo `MOVIMIENTOS_LEER` se pueden consultar las rutas y opciones, pero no ejecutar un POST; cada escritura exige el permiso de su operación.
- [ ] Una variante inactiva con saldo se puede seleccionar para salida o ajuste negativo, pero no para traslado ni aumento.
- [ ] El selector distingue búsqueda aún no iniciada, carga, ausencia de resultados y error con reintento; permite selección con teclado y carga de más páginas.
- [ ] Cambiar de almacén actualiza el saldo mostrado y las opciones; el servidor vuelve a validar todo al registrar.
- [ ] Un error de API conserva los datos y no muestra éxito; un fallo de red con resultado incierto permite reenviar exactamente los mismos datos y la misma clave, sin crear un segundo movimiento.
- [ ] Tras éxito se muestra el ID, se limpian las filas y el motivo, se mantienen tipo y almacén y se actualizan las consultas afectadas.
- [ ] Pasan las pruebas relevantes y `npm run build` en `front-tienda`.

## Decisions

- **Yes:** reutilizar página, componentes y rutas existentes; no crear otra pantalla para operaciones reales.
- **Yes:** búsqueda remota paginada, unidades y factores del catálogo; no conservar `caja = 10` ni stock ficticio.
- **Yes:** lectura con `MOVIMIENTOS_LEER` y escritura con `SALIDAS_CREAR`, `TRASLADOS_CREAR` o `AJUSTES_CREAR`, verificada de nuevo al registrar.
- **Yes:** conservar datos y clave idempotente ante un resultado incierto; no asumir que una respuesta de red perdida implica que no se registró el movimiento.
- **No:** persistir borradores localmente ni añadir historial o detalle en este alcance.

## Risks

| Risk | Mitigation |
| --- | --- |
| Cambiar almacén deja seleccionada una variante con saldo obsoleto. | Reconsultar opciones y saldo, y volver a validar en el servidor al registrar. |
| La respuesta de red se pierde después de confirmar el movimiento. | Mantener clave y contenido inmutables hasta reintentar y recibir la confirmación del mismo movimiento. |

## What is **not** in this spec

- Ningún historial, detalle, borrador persistente, edición o anulación de movimientos.
- Ningún cambio al registro de ingresos de Compras.
