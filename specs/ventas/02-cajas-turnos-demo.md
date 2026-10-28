# SPEC 02 — Demo interactiva de cajas y turnos

> **Status:** Aprobado
> **Depends on:** SPEC 01 de `specs/ventas/`
> **Date:** 2026-10-27
> **Objective:** Convertir la página de Cajas y turnos en una demo interactiva que permita consultar cajas, operar turnos y movimientos, cuadrar cierres y revisar reportes diarios con datos de prueba.

## Why this spec exists

La SPEC 01 dejó `/admin/ventas/cajas-turnos` como pantalla informativa. `api-tienda` tiene entidades preliminares, pero aún no ofrece endpoints operativos de caja; esta entrega permite probar la experiencia sin presentar datos ficticios como operaciones reales ni resolver prematuramente las reglas pendientes del backend.

## Scope

**In:**

- Sustituir el aviso de `/admin/ventas/cajas-turnos` por una pantalla identificada visiblemente como **Demo**; conservar la ruta, el menú y la protección con `CAJAS_TURNOS_LEER` del sistema `VENTAS`.
- Mostrar cuatro indicadores: cajas con turno abierto frente al total, efectivo esperado de turnos abiertos, cobros netos en efectivo del día y cobros netos por Yape del día. Las ventas del día incluyen los turnos ya cerrados; el efectivo en caja no.
- Listar cajas con nombre, código, estado del día, turno, responsable, importes y acciones pertinentes; buscar por nombre o código y filtrar por «Todas», «Abiertas» y «Cerradas». «Cerradas» comprende cualquier caja sin turno activo y distingue «Sin turno activo» de «Día cerrado».
- Crear cajas solicitando únicamente nombre y asignar el siguiente código libre `CJ-001`, `CJ-002`, etc.; dejar la caja activa y sin turno abierto.
- Abrir un turno con saldo inicial manual no negativo en el primer turno de cada día; si ya hubo un turno de la caja en esa fecha, el siguiente toma automáticamente el efectivo realmente contado en el cierre anterior.
- Registrar ingresos y egresos manuales con importe positivo, motivo y responsable de prueba en el turno abierto; reflejarlos en el cuadre y la actividad reciente.
- Cerrar turno o cerrar día desde un turno abierto mediante efectivo contado obligatorio, desglose de efectivo esperado, diferencia visible y observación opcional. Una diferencia no se ajusta automáticamente ni impide cerrar.
- Mostrar actividad reciente de aperturas, movimientos y cierres, sin inventar operaciones nuevas de venta. Ofrecer un reporte por caja y fecha, **Provisional** con turnos abiertos o sin cierre de día y **Final** después del cierre diario, con detalle por turno y totales consolidados.
- Conservar los reportes de fechas anteriores durante la sesión. Usar el día actual en `America/Lima` como fecha inicial y permitir «Avanzar día» para probar la reapertura, solo cuando no quede ningún turno abierto.
- Seguir la jerarquía y los flujos de las capturas, adaptados a `DESIGN.md`, Tailwind/daisyUI y los temas `ferreteria` y `light`; cubrir escritorio, móvil, teclado, foco, estados vacíos y validaciones.

**Out of scope (for future specs):**

- Endpoints, migraciones, permisos nuevos o persistencia de caja en `api-tienda`; esta demo no envía ni guarda operaciones reales.
- Registro de ventas nuevas, pagos reales, promociones, anulaciones, devoluciones, reintegros nuevos o traslados de efectivo entre cajas.
- Exportación o impresión del reporte, corrección de cierres históricos y persistencia local entre recargas.

## Data model

- `src/app/ventas/demo/cajas-turnos-demo.models.ts`: tipos de estado local `DemoCaja { id, codigo, nombre, activo }`, `DemoTurno { id, cajaId, numero, fechaOperativa, fechaApertura, fechaCierre, saldoInicialCentavos, efectivoContadoCentavos, diferenciaCentavos, tipoCierre, observacion, responsableApertura, responsableCierre }`, `DemoMovimientoCaja { id, turnoId, tipo, importeCentavos, motivo, responsable, fecha }` y registros precargados de venta con `turnoId`, cobros y vueltos diferenciados por `efectivo`/`yape`. Los campos de cierre son nulos hasta cerrar el turno; `tipoCierre` es `turno | dia | null`.
- `src/app/ventas/demo/cajas-turnos-demo-data.ts`: crear datos de prueba coherentes para la fecha operativa de Lima. `CJ-001` empieza con un turno abierto: saldo S/ 50, cobros en efectivo S/ 100, cobros Yape S/ 68, ingreso manual S/ 20 y egreso manual S/ 10; efectivo esperado S/ 160. `CJ-002` empieza con el día cerrado y al menos dos turnos cuyo saldo transferido y efectivo contado permitan comprobar el consolidado.
- `src/app/ventas/demo/cajas-turnos-demo.store.ts`: fuente única del estado en memoria mediante señales de Angular y valores derivados mediante `computed`; almacena fecha simulada, cajas, turnos, ventas de prueba y movimientos. La vista conserva solo selección de filtro, búsqueda y estado de formularios/diálogos. No se usa `localStorage` ni TanStack Query para la demo.
- Todos los importes se calculan en céntimos enteros y se presentan en soles con dos decimales. Por turno, `efectivoEsperado = saldoInicial + cobrosEfectivo - vueltosEfectivo + ingresos - egresos - reintegrosEfectivo`; los reintegros precargados son cero y la demo no crea otros. El Yape neto se presenta aparte y nunca aumenta el efectivo físico. La diferencia de cierre es `efectivoContado - efectivoEsperado`.
- Los indicadores de ventas suman pagos netos de la fecha operativa seleccionada en todos sus turnos, también los cerrados. El efectivo en caja suma el efectivo esperado de los turnos abiertos de esa fecha. El reporte agrega operaciones de todos los turnos de una caja/fecha sin volver a sumar como ingreso el saldo trasladado de un turno al siguiente.
- El reporte provisional incluye el efectivo esperado actual del turno abierto, pero no le atribuye efectivo contado ni diferencia antes del cierre. El último turno con `tipoCierre: 'dia'` identifica el día cerrado. El cierre diario bloquea una nueva apertura de esa caja en la misma fecha; al avanzar día, la primera apertura vuelve a requerir saldo manual.
- Códigos e identificadores de demo son locales y no se confunden con UUID o registros reales. «Avanzar día» suma un día calendario a la fecha operativa simulada, que puede ser posterior a la fecha real; un aviso la identifica como fecha de prueba. Al recargar la página se recuperan los datos iniciales y la fecha actual de Lima.

## Implementation plan

1. Añadir modelos, datos iniciales y funciones de cálculo en `src/app/ventas/demo/`, con pruebas unitarias de sumas, saldo trasladado, día cerrado y fechas; mantener la página informativa existente utilizable mientras se prepara el estado.
2. Crear el store de señales y sus operaciones locales con validaciones; probar códigos únicos, importes, prohibición de movimientos en turnos cerrados y cierre de día sin nuevas aperturas en la misma fecha.
3. Sustituir `src/app/ventas/pages/cajas-turnos/cajas-turnos-page.ts` y `.html` por indicadores, buscador, filtros y tarjetas de cajas, con identificación «Demo» y estados vacíos; mantener la ruta y el permiso actuales.
4. Añadir formularios de creación de caja y apertura de turno, con mensajes de error y actualización inmediata de indicadores y filtros; probar primera apertura manual y siguientes aperturas con saldo heredado.
5. Añadir el formulario de movimiento y la lista de actividad reciente; comprobar que solo los movimientos manuales afectan al cuadre y que los cobros de ventas precargados no se duplican como ingresos.
6. Añadir diálogos separados de «Cerrar turno» y «Cerrar día» con desglose, validación de contado, diferencia, observación y confirmación; comprobar cierre con diferencia, saldo heredado y prohibición de reapertura tras el cierre diario.
7. Añadir reporte provisional/final por caja y fecha y el control «Avanzar día»; permitir consultar reportes de fechas anteriores en sesión, bloquear el avance con turnos abiertos y probar que el consolidado no duplica saldos.
8. Completar pruebas de interacción en `src/app/ventas/pages/cajas-turnos/` y del store; verificar los temas `ferreteria`/`light`, 390 px y escritorio, navegación por teclado y foco de diálogos, y ejecutar `npm test -- --watch=false` y `npm run build` en `front-tienda`.

## Acceptance criteria

- [ ] La ruta sigue protegida por `CAJAS_TURNOS_LEER` de `VENTAS`, muestra «Demo» de forma visible y no hace llamadas HTTP para cajas, turnos, movimientos ni ventas.
- [ ] Al entrar aparecen una caja con turno abierto y otra con día cerrado; el efectivo esperado inicial de `CJ-001` es S/ 160 y las ventas precargadas muestran S/ 100 en efectivo y S/ 68 en Yape.
- [ ] Crear caja exige un nombre no vacío, asigna el siguiente código libre y permite abrir su primer turno con un saldo manual no negativo.
- [ ] La búsqueda encuentra nombre o código; «Abiertas» incluye solo cajas con turno activo y «Cerradas» incluye las demás sin confundir turno cerrado con día cerrado.
- [ ] Los indicadores de ventas incluyen todos los turnos de la fecha seleccionada, incluso cerrados; «Efectivo en caja» suma únicamente los turnos abiertos.
- [ ] Un ingreso o egreso con importe positivo y motivo modifica el efectivo esperado del turno correspondiente y aparece con responsable en actividad; un importe inválido no se registra.
- [ ] Ambos cierres exigen ingresar explícitamente efectivo contado; S/ 0 es válido, una diferencia se guarda con su signo y la observación puede quedar vacía.
- [ ] Tras cerrar turno no se añaden movimientos a ese turno; el siguiente de la misma caja y fecha comienza con el efectivo contado, no con el esperado.
- [ ] «Cerrar día» requiere un turno abierto, guarda su cuadre e impide otra apertura de la misma caja en esa fecha.
- [ ] El reporte provisional muestra el turno abierto sin inventar efectivo contado ni diferencia; el final muestra todos los turnos y separa efectivo, Yape, ingresos, egresos y diferencias sin duplicar saldos entre turnos.
- [ ] «Avanzar día» se bloquea si hay turnos abiertos; después del avance se pueden consultar reportes previos y abrir una caja cuyo día anterior estaba cerrado con un nuevo saldo manual.
- [ ] Recargar restaura los datos iniciales; el estado vacío y las búsquedas sin resultados tienen mensajes claros y no muestran operaciones ficticias como reales.
- [ ] A 390 px no aparece desplazamiento horizontal; formularios y diálogos son utilizables por teclado con foco visible y ambos temas conservan legibilidad.
- [ ] Pasan `npm test -- --watch=false` y `npm run build` en `front-tienda`.

## Decisions

- **Sí:** demo funcional solo en Angular, con estado en memoria y reinicio al recargar; evita fingir que la API preliminar ya implementa caja.
- **Sí:** permiso `CAJAS_TURNOS_LEER` actual para acceder a la demo; sus acciones son locales y no se crean permisos de escritura simulados.
- **Sí:** ventas únicamente precargadas y coherentes con los importes mostrados; el registro de ventas real pertenece a otra entrega.
- **Sí:** código secuencial generado y formulario de caja con solo nombre; `Caja` no tiene campos de mostrador o tienda.
- **Sí:** diferencia de cuadre permitida y observación opcional, de acuerdo con `docs/requerimientos/modulos/caja.md` de `api-tienda`.
- **Sí:** fecha inicial de Lima y avance manual bloqueado por turnos abiertos; permite probar cierres diarios sin esperar al siguiente día real.
- **Sí:** reporte provisional antes del cierre y final después, con historia limitada a esta sesión.
- **Sí:** adaptar la composición de las capturas al sistema visual existente; no replicarlas a costa de los temas o la accesibilidad.
- **No:** totales fijos independientes de los registros, persistencia local o endpoints ficticios; inducirían a creer que los saldos son reales o inconsistentes.

## Risks

| Risk                                                                  | Mitigation                                                                                                             |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Los saldos de prueba se confunden con dinero real.                    | Rotular la página, la fecha avanzada y los reportes como demo; no escribir en la API y reiniciar al recargar.          |
| Sumar pagos Yape o saldos trasladados infla el efectivo o el reporte. | Mantener medios separados y derivar totales desde turnos, pagos y movimientos; probar varios turnos.                   |
| La hora del equipo no coincide con el día operativo de Lima.          | Calcular la fecha inicial en `America/Lima` y avanzar por días calendario, sin reutilizar fechas UTC como fecha local. |
| La fecha simulada avanza más allá del día real.                       | Mostrarla como fecha operativa de prueba y bloquear el avance mientras haya turnos abiertos.                           |

## What is **not** in this spec

- No se modifica `api-tienda` ni se habilitan operaciones comerciales reales.
- No se registran ventas nuevas ni se persisten los cambios de la demo entre recargas.
- No se exportan reportes, se corrigen cierres ni se trasladan fondos entre cajas distintas.
