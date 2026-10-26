# SPEC 17 — Interfaz del dashboard de reposición

> **Status:** Borrador
> **Depends on:** SPEC 04, SPEC 08, SPEC 13, SPEC 16
> **Date:** 2026-10-25
> **Objective:** Crear un inicio operativo de Inventario que muestre alertas de reposición y actividad reciente y permita configurar mínimos desde Existencias.

## Scope

**In:**

- Convertir `/admin/inventario` en la página «Resumen», enlazarla desde el menú de Inventario y conservar `/admin` como selector de sistemas.
- Al entrar sin almacén en la URL, seleccionar el primer almacén activo según el orden de creación expuesto por SPEC 16 mediante el listado de Existencias o de Movimientos que el usuario pueda leer; si solo puede leer Compras, no cargar selector ni fijar almacén. Conservar el almacén y las fechas en la URL cuando se cambian.
- Mostrar tarjetas de variantes bajo mínimo, agotadas, compras del período y salidas del período; compras se rotula siempre «Todos los almacenes», mientras stock y salidas respetan el almacén elegido.
- Mostrar las diez alertas de reposición con SKU, almacén, saldo y mínimo, y un enlace a Existencias filtradas por almacén/SKU; los agotados sin mínimo muestran «Sin mínimo configurado».
- Mostrar barras diarias de conteos de compras globales y salidas del almacén para los últimos 30 días inclusivos por defecto en `America/Lima`, con rango editable y tabla o lista textual equivalente accesible.
- Mostrar últimas cinco compras y cinco salidas del rango, con enlaces a los detalles existentes cuando el usuario tenga el permiso respectivo.
- Añadir en cada fila de Existencias la lectura y edición/borrado del mínimo en unidad base, únicamente con `EXISTENCIAS_EDITAR_MINIMO`; validar en cliente y dejar que la API valide de nuevo.
- Mantener secciones independientes por permiso: `EXISTENCIAS_LEER`, `COMPRAS_LEER` y `MOVIMIENTOS_LEER`; contemplar carga, ausencia de datos, 403, error y reintento por módulo.

**Out of scope (for future specs):**

- Modificaciones en `api-tienda` o asignaciones automáticas de permisos; el contrato proviene de SPEC 16.
- Chart.js, `ng2-charts`, ventas, métricas monetarias, notificaciones, pronósticos y listas paginadas dentro del dashboard.
- Cambiar el acceso a «Mis sistemas» en `/admin` o la presentación de otras páginas de Inventario más allá del mínimo editable en Existencias.

## Data model

- `src/app/api/interfaces/inventario/existencia.interface.ts`: añadir `minimoBase: string | null` a `ExistenciaItem`; conservar `cantidadBase` y mínimo como cadenas decimales.
- `src/app/api/interfaces/inventario/resumen-reposicion.interface.ts`: tipos de `ResumenReposicion`, `ResumenComprasInventario`, `ResumenSalidasInventario`, alertas, series `{ fecha: string; cantidad: number }[]` y recientes; reproducir la nulabilidad y los límites de SPEC 16.
- `src/app/api/inventario/existencia-api.ts`: añadir `resumenReposicion(almacenId)`, `guardarMinimo(varianteId, almacenId, minimoBase)` y `quitarMinimo(varianteId, almacenId)`; agregar clientes de los dos resúmenes de actividad a `compra-api.ts` y `movimiento-api.ts`.
- `src/app/api/interfaces/access-control/permision.interface.ts`: `EXISTENCIAS_EDIT_MINIMUM: 'EXISTENCIAS_EDITAR_MINIMO'`; reutilizar códigos existentes de lectura.
- `src/app/inventario/actions/use-dashboard-reposicion-action.ts`: tres consultas TanStack Query independientes, con claves que incluyan almacén donde aplique y fechas para las series de actividad. Ampliar `src/app/inventario/actions/use-existencias-action.ts` con mutaciones de mínimos e invalidación específica de existencias y resumen de stock.
- La respuesta remota permanece en TanStack Query; señales locales para formulario, selección y presentación. Los query params `almacenId`, `desde` y `hasta` son la fuente del filtro navegable; compras no usa `almacenId` en su petición ni en su clave de consulta.

## Implementation plan

1. Reflejar los contratos y permisos de SPEC 16 en `src/app/api/interfaces/inventario/`, `permision.interface.ts` y los clientes HTTP de Inventario; probar rutas, parámetros, decimales y errores sin afectar llamadas existentes.
2. Añadir las tres consultas del dashboard y las mutaciones de mínimos en `src/app/inventario/actions/`; probar claves completas, activación condicionada por permisos y almacenamiento válido, e invalidación selectiva tras editar o borrar.
3. Crear `src/app/inventario/pages/dashboard-reposicion/dashboard-reposicion-page.ts`, `.html` y pruebas; añadir componentes locales para alertas, barras y actividad solo cuando tengan responsabilidad propia. Empezar por selector, URL, tarjetas y estados independientes, dejando el sistema navegable al terminar el paso.
4. Incorporar barras diarias en HTML/CSS, etiquetas de alcance, equivalente textual y listas recientes con enlaces condicionados por permiso; probar fechas, días vacíos, navegación y comportamiento en móvil.
5. Añadir a `src/app/inventario/pages/existencias/` la lectura y la edición de mínimos en la fila existente, con control local accesible, validación decimal, confirmación de borrado y estados de guardado/error; leer y actualizar `almacenId` y `q` en la URL para que los enlaces de alertas abran la fila buscada, y probar filas sin stock.
6. Cambiar `src/app/inventario/inventario.routes.ts` y `src/app/system-portal/services/control-access/system-menu.service.ts` para incluir «Resumen» y hacerlo inicio de Inventario; permitir entrar con cualquiera de los tres permisos de lectura y no ejecutar llamadas a módulos no autorizados. Conservar `/admin` sin cambios.
7. Completar pruebas de URL, permisos parciales, almacenes antiguos/sin activos, fechas inválidas, actualización de tarjetas tras mutar, fallos aislados y enlaces; ejecutar `npm test -- --watch=false` y `npm run build`, y revisar 390 px y escritorio en `ferreteria` y `light` según `DESIGN.md`.

## Acceptance criteria

- [ ] `/admin/inventario` muestra «Resumen» y `/admin` sigue mostrando «Mis sistemas»; el enlace del menú aparece con cualquiera de los tres permisos de lectura.
- [ ] Sin `almacenId` en la URL se selecciona el primer almacén activo devuelto en orden de creación usando un listado autorizado; si solo hay permiso de Compras, se muestran las compras globales sin pedir almacenes, y si no hay almacenes se muestra un estado vacío para stock y salidas.
- [ ] El almacén y rango válido `desde`/`hasta` se reflejan en la URL; al recargar se recuperan, y cambiar almacén no cambia el alcance global de compras.
- [ ] El rango inicial comprende hoy y los 29 días previos en `America/Lima`; fechas inválidas o invertidas impiden consultar actividad y muestran un mensaje junto al filtro.
- [ ] Las tarjetas distinguen bajo mínimo de agotadas; nunca representan una consulta fallida o no autorizada como cero.
- [ ] Las diez alertas se muestran con saldo y mínimo en unidad base, incluso agotadas sin mínimo; su enlace abre Existencias con el almacén y SKU correspondientes.
- [ ] El gráfico de barras representa conteos diarios, distingue compras globales de salidas del almacén con etiquetas además de color y dispone de valores legibles sin interpretación visual del gráfico.
- [ ] Las listas muestran hasta cinco operaciones cada una y enlazan a compra o historial solo cuando se tiene su permiso de lectura.
- [ ] Un usuario con solo `EXISTENCIAS_LEER` ve stock y no solicita compras ni salidas; combinaciones distintas muestran únicamente sus módulos autorizados y un 403 posterior no revela datos.
- [ ] La edición de mínimo exige `EXISTENCIAS_EDITAR_MINIMO` tanto al mostrar el control como al ejecutar la mutación; acepta decimal positivo de hasta seis decimales, permite quitarlo y actualiza fila y tarjeta/alertas sin recarga completa.
- [ ] Cada módulo distingue carga, vacío y error con reintento propio; fallo de compras no impide ver stock o salidas.
- [ ] A 390 px no hay desbordamiento horizontal ni barras ilegibles; foco visible, lectura por teclado y ambos temas funcionan; pasan pruebas y build de `front-tienda`.

## Decisions

- **Sí:** entrada operativa en Inventario; `/admin` conserva la selección de sistemas.
- **Sí:** primer almacén activo por orden de creación de SPEC 16; no elegir el primero de una lista ordenada casualmente.
- **Sí:** componentes HTML accesibles para barras, sin dependencia de Chart.js o adaptador Angular para un único gráfico.
- **Sí:** compras siempre globales y etiquetadas como tales, incluso con un almacén seleccionado; las salidas y alertas sí cambian con él.
- **Sí:** secciones independientes para permisos parciales y errores aislados; ocultar un bloque no sustituye la protección del endpoint.
- **No:** métricas de ventas o importes, porque no forman parte del objetivo de reposición y podrían falsear totales incompletos.

## Risks

| Risk | Mitigation |
| --- | --- |
| El gráfico se interpreta como comparación de datos del mismo almacén. | Etiquetar compras «Todos los almacenes» en tarjeta, leyenda y serie; identificar salidas por almacén. |
| La consulta de Existencias no restaura aún filtros al volver de otra página. | Incorporar en esta spec lectura de `almacenId` y `q` al abrir Existencias y mantenerlos en la URL al buscar/cambiar filtro. |
| Cambia el permiso durante una sesión abierta. | Volver a comprobarlo antes de cada mutación y tratar 403 por módulo. |

## What is **not** in this spec

- No se modifica la API ni se añaden librerías de gráficos, pronósticos, ventas o estadísticas monetarias.
- No se convierte `/admin` en el dashboard ni se conceden permisos a roles.
