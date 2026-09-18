# SPEC 17 — Eventos operativos en tiempo real

> **Status:** Aprobado
> **Depends on:** SPEC 10 (rol responsable y permisos operativos), SPEC 11 (navegación y rutas por rol), SPEC 12 (historial de ventas y resumen por período), SPEC 13 (mi caja, sesiones y movimientos), SPEC 14 (reportes de resumen, ventas y vendedores), SPEC 15 (reportes de productos, pagos y cajas), SPEC 16 (inicio operativo por rol), API `ApiTienda` SPEC 16 (cajas, sesiones y cierres), API `ApiTienda` SPEC 17 (ventas pendientes, pago y cancelación)
> **Date:** 2026-09-12
> **Objective:** Notificar eventos operativos autenticados por Socket.IO y refrescar mediante HTTP las vistas autorizadas sin duplicar el estado de negocio en el socket.

## Why this spec exists

Los reportes y el dashboard se calculan correctamente mediante HTTP, pero no se actualizan hasta que una persona recarga la página.

Socket.IO se usará solo como señal de cambio; el API REST seguirá siendo la fuente de verdad de ventas, caja, reportes y stock.

## Scope

**In:**

- Instalar y configurar Socket.IO para NestJS y Angular.
- Crear `RealtimeModule` y un gateway bajo el namespace `/events`.
- Autenticar el handshake con JWT y rechazar conexiones sin token válido.
- Unir cada socket a las salas `user:<personId>` y `role:<role>` de sus roles autenticados.
- Permitir suscripción a `cash:<cashRegisterId>` solo después de verificar que la persona puede consultar la apertura activa de esa caja.
- Emitir `sale.created`, `sale.paid` y `sale.cancelled` después de confirmar sus transacciones de venta.
- Emitir `cash.opened`, `cash.closed` y `cash.movement.created` después de confirmar sus operaciones de caja.
- Añadir `Product.lowStockThreshold` opcional y emitir `stock.low` cuando una venta pagada haga cruzar el stock desde arriba del umbral hasta un valor menor o igual.
- Enviar eventos generales a salas `role:RESPONSABLE` y `role:ADMINISTRADOR`.
- Enviar a trabajador únicamente eventos de su sala de usuario o caja autorizada.
- Crear un servicio Angular de conexión, reconexión y suscripción que reciba eventos sin almacenar saldos ni KPI como estado del socket.
- Al recibir un evento, refrescar por HTTP los bloques afectados de Inicio, Reportes, Historial, Mi caja o Sesiones cuando el usuario esté autorizado para verlos.
- Mostrar un estado discreto de conexión y reconexión sin bloquear la operación si el socket no está disponible.
- Añadir pruebas de autenticación, salas, eventos, cruce de umbral y refresco HTTP, y validación manual con MCP de Playwright.

**Out of scope (for future specs):**

- Usar eventos WebSocket como API de creación o modificación de datos.
- Enviar dashboards, tablas completas o inventario completo por socket.
- Notificaciones push, correo, SMS o persistencia de notificaciones.
- Sincronización offline.
- Configuración visual masiva de umbrales de stock.

## Data model

```ts
// ApiTienda/src/modules/products/entities/producto.entity.ts
export class Product {
  stock: string; // decimal(12,4)
  lowStockThreshold: string | null; // decimal(12,4), null desactiva la alerta
}

// ApiTienda/src/modules/realtime/events/realtime-event.ts
export type RealtimeEventName =
  | 'sale.created'
  | 'sale.paid'
  | 'sale.cancelled'
  | 'cash.opened'
  | 'cash.closed'
  | 'cash.movement.created'
  | 'stock.low';

export interface RealtimeEvent {
  name: RealtimeEventName;
  occurredAt: string;
  entityId: number;
  cashRegisterId?: number;
}

export interface StockLowEvent extends RealtimeEvent {
  name: 'stock.low';
  productId: number;
  productName: string;
  stock: number;
  lowStockThreshold: number;
}
```

Destinos de emisión:

| Evento                  | Salas destinatarias                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `sale.created`          | `user:<sellerPersonId>`, `role:RESPONSABLE`, `role:ADMINISTRADOR`, `cash:<cashRegisterId>`              |
| `sale.paid`             | `user:<sellerPersonId>`, `role:RESPONSABLE`, `role:ADMINISTRADOR`, `cash:<cashRegisterId>`              |
| `sale.cancelled`        | `user:<sellerPersonId>`, `role:RESPONSABLE`, `role:ADMINISTRADOR`, `cash:<cashRegisterId>`              |
| `cash.opened`           | `user:<responsiblePersonId>`, `role:RESPONSABLE`, `role:ADMINISTRADOR`, `cash:<cashRegisterId>`         |
| `cash.closed`           | `user:<responsiblePersonId>`, `role:RESPONSABLE`, `role:ADMINISTRADOR`, `cash:<cashRegisterId>`         |
| `cash.movement.created` | `user:<createdByPersonId>`, `role:RESPONSABLE`, `role:ADMINISTRADOR`, `cash:<cashRegisterId>`           |
| `stock.low`             | `role:RESPONSABLE`, `role:ADMINISTRADOR`, más la sala de usuario y caja de la venta que cruzó el umbral |

Convenciones:

- `lowStockThreshold: null` desactiva la alerta para un producto.
- El umbral es no negativo y usa la misma precisión de cuatro decimales que `Product.stock`.
- La alerta se emite una sola vez al cruzar de `stock > threshold` a `stock <= threshold`; pagos posteriores con el stock ya bajo no repiten el evento.
- La emisión ocurre solo después de confirmar la transacción de base de datos.
- El token se entrega en `handshake.auth.token` como Bearer JWT sin el prefijo `Bearer`.
- El origen CORS se obtiene de configuración de entorno permitida; no se usa `origin: '*'`.
- Si la conexión se pierde, Angular intenta reconectar y la siguiente señal ejecuta una consulta HTTP completa; no se conserva ni aplica una cola de cambios local.

Archivos principales:

- `ApiTienda/src/modules/realtime/realtime.module.ts`.
- `ApiTienda/src/modules/realtime/realtime.gateway.ts`.
- `ApiTienda/src/modules/realtime/realtime.service.ts`.
- `ApiTienda/src/modules/realtime/events/`.
- `ApiTienda/src/modules/auth/services/auth.service.ts` o servicio reutilizable de validación JWT.
- `ApiTienda/src/modules/products/entities/producto.entity.ts`.
- `ApiTienda/src/modules/products/dtos/product/`.
- `ApiTienda/src/database/migrations/<timestamp>-ProductLowStockThreshold.ts`.
- `ApiTienda/src/modules/sales/services/sales.service.ts`.
- `ApiTienda/src/modules/cash/services/cash-register-openings.service.ts`.
- `ApiTienda/src/modules/cash/services/cash-movements.service.ts`.
- `FrontTienda/src/app/core/realtime/realtime.service.ts`.
- `FrontTienda/src/app/core/realtime/realtime-event.model.ts`.
- `FrontTienda/src/app/feature/inicio/`.
- `FrontTienda/src/app/feature/reportes/`.
- `FrontTienda/src/app/feature/ventas/`.
- `FrontTienda/src/app/feature/caja/`.
- Pruebas de gateway, servicios emisores, conexión y consumidores Angular.

## Implementation plan

1. Agregar dependencias de Socket.IO y configurar `RealtimeModule` con un origen permitido por entorno.
2. Crear gateway `/events` que valide el JWT de handshake, agregue las salas de usuario y rol, y desconecte clientes no autorizados.
3. Implementar la suscripción a caja con validación de consulta de la sesión activa y pruebas de acceso de trabajador, responsable y administrador.
4. Crear una migración que agregue `Product.lowStockThreshold` nullable con precisión `decimal(12,4)` y extender DTO y respuesta de producto para administrarlo por API existente.
5. Crear un servicio de emisión reutilizable y llamar a sus métodos después de confirmar transacciones de ventas, apertura, cierre y movimiento.
6. En el pago de venta, comparar stock anterior y final para emitir `stock.low` exclusivamente al cruzar el umbral configurado.
7. Añadir pruebas de gateway para token ausente, inválido y válido; además de salas y aislamiento de eventos para trabajador.
8. Añadir pruebas de dominio para emisiones posteriores al commit, payloads, destinatarios y cruce de umbral.
9. Crear `RealtimeService` Angular que conecte tras restaurar sesión, transporte el token, exponga estado de conexión y se desconecte al cerrar sesión.
10. Conectar consumidores de las páginas autorizadas para que los eventos disparen recargas HTTP acotadas, sin escribir totales ni inventario directamente desde el payload.
11. Ejecutar builds y pruebas; con MCP de Playwright, abrir sesiones autorizadas en más de una pestaña, provocar operaciones y verificar refresco, aislamiento por rol y ausencia de errores de consola.

## Acceptance criteria

- [ ] Una conexión sin token o con JWT inválido es rechazada por el gateway.
- [ ] Un socket autenticado pertenece a su sala de usuario y a cada sala de rol declarada por su JWT.
- [ ] Un trabajador no puede suscribirse a una caja donde no es responsable de la sesión activa.
- [ ] Responsable y administrador reciben los eventos generales definidos de ventas y caja.
- [ ] Trabajador no recibe eventos globales de otra persona ni de una caja no autorizada.
- [ ] `sale.created`, `sale.paid`, `sale.cancelled`, `cash.opened`, `cash.closed` y `cash.movement.created` se emiten solo tras una operación persistida correctamente.
- [ ] Un producto con umbral `null` nunca emite `stock.low`.
- [ ] Un pago que cruza el umbral emite un único `stock.low` con producto, stock final y umbral.
- [ ] Pagos posteriores con stock ya menor o igual al umbral no repiten `stock.low`.
- [ ] El frontend reconecta después de una desconexión y muestra un estado de conexión no bloqueante.
- [ ] Un evento recibido provoca una nueva consulta HTTP del bloque afectado y no altera sus totales directamente desde el payload.
- [ ] El cierre de sesión desconecta el cliente Socket.IO y elimina sus suscripciones.
- [ ] MCP de Playwright valida eventos, refresco y aislamiento con pestañas de roles distintos sin errores de consola.
- [ ] Los builds y pruebas de ambos repositorios pasan.

## Decisions

- **Sí:** usar Socket.IO autenticado con JWT en un namespace independiente para eventos en vivo.
- **Sí:** segmentar por salas de usuario, rol y caja para evitar divulgar operaciones ajenas a trabajador.
- **Sí:** usar HTTP como fuente de verdad y Socket.IO solo como señal de invalidación o refresco.
- **Sí:** agregar un umbral opcional por producto para definir stock bajo de forma explícita.
- **Sí:** emitir alerta solo al cruzar el umbral para evitar notificaciones repetidas.
- **Sí:** enviar eventos generales a responsable y administrador.
- **No:** usar `cors: { origin: '*' }`, porque el canal maneja datos operativos autenticados.
- **No:** crear, editar o cobrar mediante mensajes socket.
- **No:** incluir notificaciones persistentes ni push.

## Risks

| Riesgo                                                        | Mitigación                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Un socket conserva permisos después de un cambio de rol.      | El JWT es la instantánea de permisos; desconectar al cerrar sesión y requerir autenticación renovada para cambios de rol. |
| Se emite un evento de una transacción que luego revierte.     | Emitir únicamente después del commit exitoso de la operación transaccional.                                               |
| La reconexión pierde señales intermedias.                     | Cada señal refresca desde REST y la aplicación continúa funcional sin socket.                                             |
| Un umbral bajo dispara alertas repetidas.                     | Emitir solo en el cruce desde encima del umbral.                                                                          |
| Una suscripción de caja filtra eventos a un trabajador ajeno. | Autorizar cada suscripción contra la sesión activa y probar aislamiento.                                                  |

## What is **not** in this spec

- Socket como canal de comandos o fuente de datos.
- Push, correo, SMS o bandeja persistente de notificaciones.
- Sincronización offline.
- Configuración masiva de umbrales de inventario.
- Exportación o nuevos reportes.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
