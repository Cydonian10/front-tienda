# SPEC 07 — API de salidas, traslados y ajustes de stock

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 03
> **Date:** 2026-10-21
> **Objective:** Registrar salidas, traslados y ajustes confirmados mediante una API transaccional que conserve cantidades, valoración e historial de inventario.

## Why this spec exists

`api-tienda` registra ingresos al confirmar compras y consulta existencias, pero todavía no registra los otros tres tipos de movimiento que presenta `src/app/inventario/pages/movimientos/movimientos-page.ts`. La pantalla actual utiliza datos ficticios y no modifica stock.

## Scope

**In:**

- Añadir `POST /api/movimientos` para confirmar una `salida`, un `traslado` o un `ajuste` y devolver el ID del movimiento.
- Añadir `GET /api/movimientos/almacenes` y `GET /api/movimientos/variantes` para seleccionar almacenes activos y buscar variantes por nombre o SKU con saldo y unidades reales. Ambas consultas requieren `MOVIMIENTOS_LEER`, sin exigir permisos de administración de almacenes o productos.
- Registrar `MOVIMIENTOS_LEER`, `SALIDAS_CREAR`, `TRASLADOS_CREAR` y `AJUSTES_CREAR` en `INVENTARIO`, sin asignarlos automáticamente a roles. El POST exige el permiso correspondiente a su tipo.
- Confirmar movimiento, detalles y cambios en `existencias` dentro de una única transacción; calcular valor a costo promedio por variante y almacén.
- Guardar una clave idempotente por usuario: repetir el mismo envío no vuelve a cambiar existencias; reutilizar la clave con otro contenido produce conflicto.
- Crear y ejecutar pruebas automatizadas específicas y verificar la compilación de la API.

**Out of scope (for future specs):**

- Interfaz Angular; corresponde a SPEC 08.
- Listado y detalle histórico de movimientos, borradores, edición y anulaciones.
- Ingresos manuales, recepción parcial y cambios al flujo de Compras.

## Data model

- `api-tienda/src/features/inventory/entities/movimiento-inventario.entity.ts` añade `idempotenciaClave: string | null` e `idempotenciaHash: string | null`. Una migración incremental en `api-tienda/src/database/migrations/` permite nulos para movimientos anteriores e impone unicidad de `(usuario_id, idempotencia_clave)` cuando la clave no es nula. La huella se calcula a partir de los datos validados del movimiento, sin incluir la clave.
- `POST /api/movimientos` recibe JSON `{ idempotenciaClave: string, tipo: 'salida' | 'traslado' | 'ajuste', almacenOrigenId: string, almacenDestinoId?: string, motivo?: string, detalles: { varianteId: string, unidadId: string, cantidad: string, costoUnitarioBase?: string }[] }`. Los identificadores son UUID. `almacenDestinoId` solo se admite en traslados; origen y destino deben ser distintos. En ajuste, `almacenOrigenId` identifica el almacén ajustado en el contrato de entrada y se guarda como `almacenDestino` para respetar la restricción de la entidad existente.
- `motivo` es obligatorio y no vacío en ajustes; en salida y traslado es opcional. `cantidad` es positiva en salida/traslado y distinta de cero en ajuste. `costoUnitarioBase` es obligatorio solo en líneas de ajuste positivo, puede ser cero y representa PEN por unidad **base**. No se acepta costo proporcionado por el cliente en los demás casos. Cada variante aparece a lo sumo una vez por movimiento y se exige al menos un detalle.
- Cantidades, factores y costos se reciben y devuelven como cadenas decimales. Se admiten hasta seis decimales en la cantidad; `cantidad × factorABase` debe representarse exactamente con seis decimales o se rechaza. El servidor obtiene el factor del producto y guarda la unidad y el factor aplicados en `DetalleMovimiento`.
- Salida y ajuste negativo restan cantidad y valor al promedio anterior del almacén. Traslado resta ambos del origen y añade al destino **exactamente el mismo valor**; no altera el valor total entre los dos. Ajuste positivo añade `cantidadBase × costoUnitarioBase`. El valor aplicado a cada detalle se redondea a seis decimales, mitad hacia arriba. Si una operación consume toda la cantidad de una existencia, fija su valor restante exactamente en cero.
- Un producto o variante inactivos solo pueden reducir su stock mediante salida o ajuste negativo; traslado y ajuste positivo requieren ambos activos. Los almacenes involucrados deben estar activos. Salidas, traslados y ajustes negativos rechazan stock insuficiente; nunca quedan cantidad o valor negativos.
- `GET /api/movimientos/almacenes` devuelve `{ id, nombre }[]` de almacenes activos. `GET /api/movimientos/variantes?tipo=<tipo>&almacenId=<uuid>&q=<texto>&page=1&limit=20` exige al menos dos caracteres de búsqueda y devuelve una respuesta paginada con producto, variante, estados, SKU, `cantidadBase` del almacén y unidades válidas `{ id, nombre, simbolo, factorABase }`. Para salida incluye variantes activas o inactivas con saldo; para traslado solo catálogo activo con saldo; para ajuste incluye catálogo activo incluso sin saldo y catálogo inactivo con saldo para permitir su reducción. Un almacén inválido o inactivo se rechaza.
- La creación responde con `{ id, tipo, estado: 'confirmado' }`. Un reintento del mismo usuario y clave con el mismo contenido validado devuelve el mismo ID sin crear otro movimiento; la misma clave con contenido distinto responde `409`. La clave pertenece al usuario autenticado, nunca al cuerpo como `usuarioId`.

## Implementation plan

1. Registrar permisos en `api-tienda/src/shared/authorization/permission-codes.ts` y `permission-definitions/inventario.ts`; añadir entidad y migración de idempotencia sin cambiar las escrituras existentes de Compras. Cubrir catálogo y migración con pruebas.
2. Crear DTO, consultas y controlador en `api-tienda/src/features/inventory/movimientos/`; registrar sus proveedores en `inventory.module.ts`. Cubrir permisos, paginación, almacenes inactivos y resultados vacíos.
3. Añadir el comando de creación y sus validaciones de tipo, almacenes, catálogo, unidades, cantidades, costo y variantes repetidas. Mantener los rechazos previos a cualquier escritura.
4. Implementar salida y ajuste negativo en `api-tienda/src/features/inventory/movimientos/commands/` con `UnitOfWork`, cálculos decimales y bloqueo de existencias en orden estable. Probar consumo parcial y total, stock insuficiente y rollback.
5. Completar traslado y ajuste positivo en la misma ruta transaccional. Probar transferencia de valor, costo explícito, productos inactivos, precisión y concurrencia con compras y otros movimientos.
6. Completar idempotencia ante envíos repetidos y simultáneos; documentar permisos, contratos y reglas de valoración en `api-tienda/docs/modelos/02-inventario-costos.md`. Ejecutar pruebas específicas y `npm run build` en `api-tienda`.

## Acceptance criteria

- [x] Un POST válido crea exactamente un `MovimientoInventario` confirmado y sus detalles, y actualiza las existencias del almacén o almacenes correctos.
- [x] Un traslado conserva la suma de cantidades y la suma de `valorCosto` entre origen y destino; una salida reduce ambos y un ajuste aplica el signo de cada detalle.
- [x] Los detalles conservan unidad, factor, cantidad base y costo aplicado; al agotar una existencia, cantidad y valor restantes son cero.
- [x] Un ajuste positivo exige costo por unidad base explícito, admite cero y no lo infiere del precio de venta ni de una compra anterior.
- [x] Se rechazan sin cambios parciales almacenes inválidos o inactivos, origen igual a destino, stock insuficiente, unidad ajena al producto, cantidades no representables a seis decimales, variantes repetidas y aumentos de catálogo inactivo.
- [x] `MOVIMIENTOS_LEER` habilita solo ambas consultas; cada tipo de POST exige su permiso específico y no admite que el cliente suplante al usuario.
- [x] La búsqueda filtra por nombre o SKU desde dos caracteres, pagina resultados y permite localizar stock inactivo para salida o ajuste negativo sin ofrecerlo para traslado.
- [x] Reenviar el mismo contenido con la misma clave y usuario devuelve el mismo ID y afecta el stock una sola vez, incluso ante envíos simultáneos; reutilizar la clave con otro contenido devuelve `409`.
- [x] Pasan las pruebas específicas y `npm run build` en `api-tienda`.

## Decisions

- **Yes:** API y pantalla en specs separadas, siguiendo las parejas existentes de Compras y Existencias.
- **Yes:** un solo POST con discriminante `tipo`; cada tipo mantiene validaciones y permisos propios.
- **Yes:** costo promedio móvil por variante y almacén; ajustes positivos requieren costo explícito por unidad base y las reducciones usan el costo existente.
- **Yes:** permitir reducir stock de catálogo inactivo sin permitir aumentarlo ni trasladarlo.
- **Yes:** una sola línea por variante y clave idempotente persistida por usuario; el bloqueo del botón en la UI no protege reintentos de red.
- **No:** modificar solo cantidades sin valor, inferir el costo del precio de venta o introducir historial navegable en este alcance.

## Risks

| Risk                                                               | Mitigation                                                                                                     |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Dos operaciones concurrentes consumen el mismo saldo.              | Bloquear o actualizar atómicamente existencias en la transacción y adquirir bloqueos en orden estable.         |
| El redondeo deja valor residual o intenta producir valor negativo. | Redondear por detalle y, al consumir toda la cantidad, usar exactamente el valor restante del origen.          |
| Un reintento llega antes de concluir el primer envío.              | Aplicar unicidad por usuario y clave, esperar el resultado confirmado y comparar la huella antes de responder. |

## What is **not** in this spec

- Ninguna interfaz Angular ni listado o detalle histórico de movimientos.
- Ningún ingreso manual, borrador, edición o anulación.
