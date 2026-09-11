# SPEC 08 — Página de ventas y cobro

> **Status:** Borrador
> **Depends on:** SPEC 07 (cajas y aperturas), API `TiendaApi` SPEC 06, API `TiendaApi` SPEC 11, API `TiendaApi` SPEC 12, API `TiendaApi` SPEC 16, API `TiendaApi` SPEC 17
> **Date:** 2026-09-11
> **Objective:** Añadir una página en `Operaciones > Ventas` para que administradores y trabajadores gestionen ventas mediante una sesión de caja propia abierta.

## Scope

**In:**

- Nueva ruta `/operaciones/ventas`.
- Nueva entrada **Ventas** bajo **Operaciones**.
- Acceso para `ADMINISTRADOR` y `TRABAJADOR`.
- Uso exclusivo de aperturas cuyo `responsible` sea la persona autenticada.
- Bloqueo del punto de venta y enlace a `/operaciones/cajas` cuando no exista una sesión propia abierta.
- Búsqueda paginada de productos mediante `GET /products`.
- Carrito con una sola línea por producto.
- Selector paginado obligatorio de personas como cliente.
- Descuento fijo no negativo.
- Guardado de ventas `PENDING`.
- Edición de ventas `PENDING`.
- Cobro mediante un único método de pago activo.
- Importe de pago exactamente igual al total.
- Cancelación con motivo obligatorio.
- Historial en la misma página con estado, sesión, fechas, vendedor e ID de sesión.
- Administradores pueden consultar todas las ventas.
- Trabajadores solo pueden consultar sus propias ventas.
- Administradores pueden cancelar cualquier venta con sesión abierta.
- Trabajadores pueden cancelar sus propias ventas autorizadas.
- Persistencia únicamente después de guardar la venta; el borrador no se conserva en `localStorage`.
- Ajuste del API para permitir métodos de pago activos a ambos roles.
- Validación backend de responsable propio al crear, editar y pagar.
- Pruebas unitarias frontend y backend.

**Out of scope (specs futuros):**

- Apertura o cierre de caja desde la pantalla de ventas.
- Gestión administrativa de métodos de pago.
- Tickets, impresión o comprobantes.
- Ventas fiadas o cobros posteriores.
- Pagos mixtos o múltiples pagos.
- Devoluciones parciales.
- Reportes y exportaciones.
- Persistencia local del carrito.
- CRUD de personas o productos.
- Nuevo endpoint para listar sesiones históricas.
- Operaciones sobre ventas después del cierre de caja.

## Data model

```ts
// src/app/core/models/sale.model.ts
export type SaleStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type SalePaymentStatus = 'PAID' | 'CANCELLED';

export interface SaleDetail {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalePayment {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  status: SalePaymentStatus;
}

export interface Sale {
  id: number;
  saleDate: string;
  customerId: number;
  customerName: string;
  sellerId: number;
  sellerName: string;
  cashOpeningId: number;
  discount: number;
  totalAmount: number;
  status: SaleStatus;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelledById: number | null;
  cancellationReason: string | null;
  payment: SalePayment | null;
  details: SaleDetail[];
}

export interface CreateSaleDetail {
  productId: number;
  quantity: number;
}

export interface CreateSale {
  cashOpeningId: number;
  customerId: number;
  discount?: number;
  details: CreateSaleDetail[];
}

export interface UpdateSale {
  customerId?: number;
  discount?: number;
  details?: CreateSaleDetail[];
}

export interface PaySale {
  paymentMethodId: number;
  amount: number;
}

export interface CancelSale {
  cancellationReason: string;
}

export interface SaleFilter extends PaginationQuery {
  status?: SaleStatus;
  cashOpeningId?: number;
  sellerId?: number;
  startDate?: string;
  endDate?: string;
}

export interface SaleCartLine {
  product: Product;
  quantity: number;
}
```

```ts
// src/app/core/models/payment-method.model.ts
export interface PaymentMethod {
  id: number;
  name: string;
  active: boolean;
}
```

```ts
// src/app/core/api/sales.service.ts
findAll(filter: SaleFilter): Observable<PaginatedResult<Sale>>;
findOne(id: number): Observable<Sale>;
create(dto: CreateSale): Observable<Sale>;
update(id: number, dto: UpdateSale): Observable<Sale>;
pay(id: number, dto: PaySale): Observable<Sale>;
cancel(id: number, dto: CancelSale): Observable<Sale>;
```

```ts
// src/app/core/api/payment-methods.service.ts
findActive(): Observable<PaymentMethod[]>;
```

Se reutilizan `Product`, `Person`, `CashRegister` y `PaginatedResult` existentes. No se crean tablas ni migraciones nuevas.

Archivos principales del frontend:

- `src/app/core/models/sale.model.ts`.
- `src/app/core/models/payment-method.model.ts`.
- `src/app/core/api/sales.service.ts`.
- `src/app/core/api/payment-methods.service.ts`.
- `src/app/core/api/people.service.ts`.
- `src/app/feature/operaciones/ventas/pages/ventas.page.ts`.
- `src/app/feature/operaciones/ventas/pages/ventas.page.html`.
- `src/app/feature/operaciones/ventas/components/sales-product-picker/`.
- `src/app/feature/operaciones/ventas/components/sale-cart/`.
- `src/app/feature/operaciones/ventas/components/sales-filters/`.
- `src/app/feature/operaciones/ventas/components/sales-history-table/`.
- `src/app/feature/operaciones/ventas/dialogs/sale-payment-dialog.ts` y `.html`.
- `src/app/feature/operaciones/ventas/dialogs/sale-cancellation-dialog.ts` y `.html`.
- `src/app/feature/operaciones/ventas/dialogs/sale-detail-dialog.ts` y `.html`.
- `src/app/feature/operaciones/operaciones.routes.ts`.
- `src/app/core/services/dashboard.service.ts`.

Archivos principales del API:

- `TiendaApi/src/modules/cash/controllers/payment-methods.controller.ts`.
- `TiendaApi/src/modules/cash/services/payment-methods.service.ts`.
- `TiendaApi/src/modules/sales/controllers/sales.controller.ts`.
- `TiendaApi/src/modules/sales/services/sales.service.ts`.
- `TiendaApi/test/unit/cash/payment-methods.controller.spec.ts`.
- `TiendaApi/test/unit/sales/sales.controller.spec.ts`.

Convenciones:

- La apertura propia se identifica comparando `openOpening.responsible.id` con la persona autenticada.
- Si existen varias aperturas propias, el usuario debe seleccionar una de ellas.
- El API es la fuente de verdad para precios, stock, totales y estados.
- Cada producto ocupa una sola línea del carrito; agregarlo nuevamente incrementa su cantidad.
- La cantidad es un entero positivo.
- El descuento es un monto fijo no negativo y no puede superar el subtotal.
- El borrador en memoria se pierde al recargar o abandonar la página.
- Una venta guardada `PENDING` permanece disponible en el historial.
- El pago debe usar un método activo y un importe exactamente igual al total.
- No se calcula vuelto y no se permiten pagos mixtos.
- El historial inicia con las fechas del día local actual, sin filtro de estado y con 20 registros.
- `cashOpeningId` y `sellerId` se capturan como IDs numéricos cuando se usan como filtros.
- Los mensajes de error del API conservan el formulario, el carrito o el historial correspondiente.

## Implementation plan

1. Ajustar `TiendaApi` para que `GET /payment-methods` sea accesible a ambos roles y devuelva únicamente métodos activos.
2. Ajustar `SalesController` y `SalesService` para recibir el usuario autenticado en crear, editar y pagar.
3. Validar en el backend que la apertura usada tenga como responsable a la persona autenticada.
4. Añadir pruebas backend para permisos, sesión propia y métodos de pago.
5. Crear los modelos `sale.model.ts` y `payment-method.model.ts`.
6. Crear `SalesService` y `PaymentMethodsService` en el frontend.
7. Extender `PeopleService` para consultar personas paginadas.
8. Crear `VentasPage` y cargar cajas, sesión propia, productos, clientes y métodos de pago.
9. Crear el buscador paginado de productos y el componente del carrito.
10. Implementar guardado de ventas pendientes mediante `POST /sales`.
11. Implementar edición de pendientes cargándolas nuevamente al carrito.
12. Implementar el diálogo de pago con método activo e importe exacto.
13. Implementar filtros e historial paginado en la misma página.
14. Implementar detalle y cancelación con motivo obligatorio.
15. Añadir estados de carga, vacío, error, conflicto y éxito.
16. Registrar la ruta y la entrada del menú.
17. Añadir pruebas unitarias de servicios, carrito, página, pago, edición y cancelación.
18. Verificar con `npm run build` y `npm test` en `front-tienda`, y con `npm run build`, `npm run lint` y `npm test` en `TiendaApi`.

## Acceptance criteria

- [ ] `/operaciones/ventas` carga para ambos roles.
- [ ] El menú muestra **Ventas** dentro de **Operaciones**.
- [ ] La página detecta aperturas propias mediante `responsible.id`.
- [ ] Sin sesión propia, el punto de venta queda bloqueado y muestra un enlace a Cajas.
- [ ] El catálogo permite buscar productos con paginación.
- [ ] Un producto no aparece duplicado en el carrito.
- [ ] Las cantidades son enteros positivos.
- [ ] El cliente es obligatorio.
- [ ] El descuento no puede ser negativo ni superar el subtotal.
- [ ] Guardar crea una venta `PENDING` sin pago ni descuento de stock.
- [ ] Una venta pendiente puede editarse desde el carrito.
- [ ] Cobrar exige un método activo.
- [ ] Cobrar exige un importe exactamente igual al total.
- [ ] Un error de pago conserva la venta como `PENDING`.
- [ ] Después de pagar se limpia el carrito y se actualiza el historial.
- [ ] El historial inicia con fechas del día actual, sin filtro de estado y con 20 registros.
- [ ] El filtro de sesión acepta un `cashOpeningId` numérico.
- [ ] El administrador puede filtrar por vendedor.
- [ ] El trabajador solo recibe sus propias ventas.
- [ ] Una venta pendiente puede cancelarse con motivo de 1 a 500 caracteres.
- [ ] Una venta pagada puede anularse mientras su sesión esté abierta.
- [ ] El administrador puede cancelar cualquier venta autorizada.
- [ ] La venta cancelada conserva sus datos de auditoría.
- [ ] El backend rechaza crear, editar o pagar usando una sesión cuyo responsable no sea el usuario.
- [ ] Los trabajadores pueden consultar métodos de pago activos.
- [ ] Los errores del API se muestran sin perder el estado editable.
- [ ] Las pruebas y builds definidos pasan correctamente.

## Decisions

- **Sí:** ubicar la funcionalidad en `Operaciones > Ventas`.
- **Sí:** permitir acceso a administradores y trabajadores.
- **Sí:** exigir una sesión propia según `responsible`.
- **Sí:** mantener la excepción administrativa para cancelar ventas ajenas.
- **Sí:** enlazar a Cajas en vez de duplicar la apertura de caja.
- **Sí:** usar un selector paginado de todas las personas.
- **Sí:** usar catálogo paginado y carrito único.
- **Sí:** separar guardar pendiente y cobrar.
- **Sí:** cargar ventas pendientes nuevamente al carrito.
- **Sí:** usar pago exacto sin vuelto ni pagos mixtos.
- **Sí:** mostrar el historial en la misma página.
- **Sí:** usar un campo numérico para `cashOpeningId`.
- **Sí:** corregir el permiso y el filtro de métodos activos en el API.
- **No:** guardar borradores en `localStorage`.
- **No:** crear un endpoint adicional para sesiones históricas.
- **No:** incluir tickets, reportes, crédito ni devoluciones.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La sesión puede cerrarse mientras se prepara una venta. | El API valida nuevamente la apertura y la interfaz muestra el conflicto. |
| El stock o precio puede cambiar antes del pago. | El servidor recalcula y valida durante la operación. |
| El carrito puede contener datos obsoletos. | El borrador no se persiste y la respuesta del API es la fuente de verdad. |
| Existen varias sesiones propias abiertas. | Mostrar únicamente las sesiones propias y exigir una selección. |
| Un trabajador intenta operar otra sesión. | Aplicar validación de responsable en el backend. |

## What is **not** in this spec

- Apertura o cierre de cajas.
- Administración de métodos de pago.
- Tickets o impresión.
- Ventas fiadas.
- Pagos mixtos.
- Devoluciones parciales.
- Reportes y exportaciones.
- Persistencia local del carrito.
- Operaciones posteriores al cierre de caja.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
