# SPEC 13 — Interfaz de historial de movimientos reales

> **Status:** Aprobado
> **Depends on:** SPEC 09, SPEC 12
> **Date:** 2026-10-24
> **Objective:** Sustituir el historial de demostración por un listado y detalle paginados de movimientos reales, con filtros en la URL y búsqueda diferida mediante señales de Angular.

## Why this spec exists

SPEC 09 dejó una interfaz basada en ejemplos y SPEC 12 ya ofrece consultas reales. La pantalla debe consumir ese contrato sin presentar operaciones ficticias como registros del inventario.

## Scope

**In:**

- Conectar `/admin/inventario/historial` a `GET /api/movimientos` y `/admin/inventario/historial/:id` a `GET /api/movimientos/:id`, conservando el permiso `MOVIMIENTOS_LEER` de INVENTARIO en ambas rutas.
- Sustituir la búsqueda local por búsqueda remota de UUID parcial, SKU, producto o almacén. Mantener el filtro de tipo e incorporar `desde` y `hasta` como días inclusivos de `America/Lima`.
- Usar la API experimental `debounced` de señales de Angular para diferir `q` 300 ms. Enviar `q` solo si el texto recortado tiene entre 2 y 200 caracteres; con cero o un carácter, consultar sin `q` e indicar el mínimo de dos caracteres. No acumular entradas del historial del navegador por tecla.
- Paginar con `src/app/shared/components/pagination/`: 20 elementos inicialmente y selector de 5, 10 o 20; restablecer a la página 1 al cambiar filtros o tamaño.
- Mantener `q`, `tipo`, `desde`, `hasta`, `page` y `limit` en los query params del listado. Omitir valores vacíos y predeterminados (`tipo=todos`, `page=1`, `limit=20`); conservar el estado al abrir un detalle y al regresar, incluso tras recargar o compartir la URL.
- Mostrar carga, vacío sin movimientos, búsqueda sin resultados, error recuperable con reintento y detalle no encontrado. Tratar IDs inválidos (400) e inexistentes (404) como «Movimiento no encontrado»; otros fallos del detalle ofrecen reintento.
- Mostrar resúmenes reales en el listado y líneas completas en el detalle; presentar «No disponible» para costos y motivo nulos, y mostrar `compraId` como texto cuando exista, sin enlace.
- Eliminar fixture, filtro local, pruebas de datos ficticios y avisos «Datos de demostración». Mantener diseño, componentes locales aprovechables, acceso por teclado, versión móvil y temas `ferreteria`/`light` conforme a `DESIGN.md`.

**Out of scope (for future specs):**

- Cambios en `api-tienda`, endpoints nuevos, permisos nuevos o modificaciones de la creación de movimientos y compras.
- Edición, anulación, creación o exportación desde el historial; enlace a la compra asociada.
- Persistencia de filtros fuera de la URL o almacenamiento de registros en el navegador.

## Data model

- `src/app/api/interfaces/inventario/historial-movimiento.interface.ts`: `TipoMovimientoHistorial = 'ingreso' | 'salida' | 'traslado' | 'ajuste'`; `FiltroHistorialMovimientos { q?: string; tipo?: TipoMovimientoHistorial; desde?: string; hasta?: string; page: number; limit: number }`. Las fechas son `YYYY-MM-DD`; `page` comienza en 1.
- En el mismo archivo, `HistorialMovimientoResumen { id: string; fecha: string; tipo: TipoMovimientoHistorial; estado: 'confirmado'; almacenOrigen: string | null; almacenDestino: string | null; cantidadDetalles: number; valorCosto: string | null }`, `HistorialMovimientosPagina { data: HistorialMovimientoResumen[]; meta: { page: number; limit: number; total: number; totalPages: number } }` y `HistorialMovimientoDetalle`, que añade `usuario: string`, `compraId: string | null`, `motivo: string | null` y `detalles: HistorialMovimientoLinea[]`.
- `HistorialMovimientoLinea { id: string; producto: string; sku: string; cantidad: string; unidad: string; factorABase: string; cantidadBase: string; costoTotal: string | null; costoAplicado: string | null }`. Conservar las cantidades y costos como cadenas decimales; no transformar los valores nulos en cero.
- `src/app/api/inventario/movimiento-api.ts` incorpora `listarHistorial(filtro)` y `obtenerHistorial(id)` con el contrato anterior. `src/app/inventario/actions/use-historial-action.ts` contiene las consultas TanStack Query; la clave del listado incluye `q`, `tipo`, `desde`, `hasta`, `page` y `limit`, y la del detalle incluye el UUID.
- `src/app/inventario/pages/historial/` conserva como estado local en señales el texto visible, tipo, fechas, página y límite. Los query params son la representación navegable de los filtros aplicados; las respuestas HTTP permanecen en TanStack Query, no se duplican en señales. Extraer la etiqueta de tipo de `historial-demo.model.ts` a un módulo de tipos/presentación real en esa carpeta.

## Implementation plan

1. Definir contratos reales en `src/app/api/interfaces/inventario/historial-movimiento.interface.ts` y añadir los dos GET a `src/app/api/inventario/movimiento-api.ts`; probar parámetros, respuesta paginada, detalle y errores con mocks HTTP.
2. Crear `src/app/inventario/actions/use-historial-action.ts` con consultas separadas de listado y detalle; probar claves completas, cambio de parámetros y aislamiento entre resultados de búsquedas consecutivas.
3. Sustituir en `historial-page.ts` y `historial-page.html` la fixture por la consulta remota, sincronizar filtros/paginación con query params y conectar la búsqueda con `debounced` de Angular a 300 ms. Validar fechas y normalizar parámetros inválidos antes de pedir datos.
4. Adaptar `components/historial-filtros.ts` y `.html` a fechas y búsqueda mínima; adaptar `components/historial-resultados.ts` y `.html` a `data`, `meta`, `cantidadDetalles`, costos nulos y enlaces de detalle que conserven los query params del listado. Incorporar `src/app/shared/components/pagination/` sin duplicar su lógica.
5. Completar en el listado estados diferenciados de carga, vacío inicial, sin coincidencias, error con reintento y rango invertido; restablecer página con cada cambio y normalizar a la última página si la URL pide una superior a `totalPages` cuando existen resultados.
6. Conectar `historial-detalle-page.ts` y `.html` al GET por UUID; adaptar `components/historial-resumen.*` y `components/historial-variantes.*` a las líneas reales, costos y motivo nulos, `compraId` textual y estados de carga, 400/404 y error recuperable. Preservar los filtros en el enlace de regreso.
7. Eliminar `historial-demo.model.ts` y `historial-demo.model.spec.ts`, migrar la etiqueta de tipo y reemplazar las expectativas ficticias de `historial-page.spec.ts`; añadir pruebas del detalle, navegación, URL, debounce, límites y estados. Verificar `npm test -- --watch=false` y `npm run build` en `front-tienda`.

## Acceptance criteria

- [ ] Ambas rutas y la entrada «Historial» siguen exigiendo `MOVIMIENTOS_LEER` de INVENTARIO; no se modifica `api-tienda`.
- [ ] El listado consulta `GET /api/movimientos` y solo presenta `data` de la página actual, `meta.total` como total de resultados y `cantidadDetalles` como número de variantes; el detalle consulta `GET /api/movimientos/:id` por UUID y muestra todas sus líneas.
- [ ] La búsqueda envía `q` recortado de 2 a 200 caracteres tras 300 ms sin teclear; con 0 o 1 carácter no envía `q` e informa del mínimo. Una respuesta anterior no sustituye los resultados de filtros nuevos.
- [ ] Tipo, búsqueda y fechas se combinan; `desde` y `hasta` se envían como `YYYY-MM-DD`, el rango invertido muestra error local y no dispara GET, y parámetros URL inválidos se normalizan antes de consultar.
- [ ] El listado comienza con 20 elementos por página; el componente compartido permite 5, 10 y 20, y cambiar cualquier filtro o el tamaño vuelve a la página 1. Una página fuera de rango con resultados se corrige a la última y actualiza la URL.
- [ ] La URL omite filtros vacíos y valores predeterminados, conserva los filtros aplicados al recargar o abrir un enlace directo y permite volver del detalle a la misma página filtrada; escribir no crea una entrada de historial por tecla.
- [ ] Se distinguen carga, ausencia total de movimientos, combinación sin resultados y error HTTP con «Reintentar»; el detalle muestra «Movimiento no encontrado» en 400/404 y ofrece reintento para otros errores.
- [ ] Costos y motivo nulos se muestran como «No disponible»; se muestra `compraId` sin enlace solo cuando existe. No se finge un costo cero ni se accede a `detalles` en la respuesta resumida del listado.
- [ ] No quedan fixture ni avisos de demostración en el historial; la tabla, las tarjetas móviles y el detalle mantienen controles accesibles por teclado, sin desbordamiento horizontal de página a 390 px y con ambos temas.
- [ ] Pasan las pruebas relevantes, `npm test -- --watch=false` y `npm run build` en `front-tienda`.

## Decisions

- **Sí:** integrar listado y detalle y retirar por completo la demo; el historial pasa a reflejar solo registros reales.
- **Sí:** mantener todos los filtros y la paginación en la URL, omitiendo los valores predeterminados; permite recarga, enlace directo y regreso al contexto anterior.
- **Sí:** `debounced` experimental de señales de Angular a 300 ms con mínimo de dos caracteres; seguir el mecanismo solicitado y respetar la validación de la API.
- **Sí:** reutilizar la paginación compartida con tamaño inicial 20 y opciones 5/10/20; no crear otra paginación.
- **Sí:** validar fechas antes de consultar y distinguir falta de datos, ausencia de coincidencias y errores; un rango invertido no se delega al backend.
- **Sí:** costos y motivo ausentes se indican, y la compra se identifica sin enlace; evitar inventar valores y nuevas dependencias de permisos.
- **No:** ampliar esta spec al backend, a acciones de escritura o a persistencia local; SPEC 12 ya fija los GET necesarios.

## Risks

| Risk                                                                                      | Mitigation                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `debounced` de Angular es experimental y podría cambiar de firma.                         | Aislar su uso en la página y fijar con pruebas el intervalo, el mínimo y la sincronización de la URL.                                            |
| Navegación, URL y debounce podrían producir peticiones duplicadas o resultados obsoletos. | Derivar las claves de consulta de los filtros aplicados, normalizar la URL y probar escritura rápida, atrás/adelante y regreso desde el detalle. |
| El listado real no contiene líneas, usuario ni motivo y puede devolver costos nulos.      | Tipar resumen y detalle por separado y probar la representación de ausencias sin depender de la fixture.                                         |

## What is **not** in this spec

- Ningún cambio de `api-tienda`, permiso nuevo ni operación de escritura desde el historial.
- Ningún dato ficticio, almacenamiento local de filtros ni enlace a compras.
