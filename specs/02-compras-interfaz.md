# SPEC 02 — Interfaz para registrar y consultar compras

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-17
> **Objective:** Permitir registrar y consultar compras con recepción inmediata y comprobante opcional desde el panel de inventario de Ferretería Atlas.

## Why this spec exists

La referencia visual `https://inventario-productos-gabriel.zudex85.chatgpt.site/` presenta lista de compras y formulario de proveedor, comprobante, productos y precios, pero usa datos locales y muestra “Guardar borrador”. Esta pantalla tomará su estructura operativa como referencia, no su identidad visual ni su persistencia: usará la API de SPEC 01 y el sistema de diseño de `DESIGN.md`.

## Scope

**In:**

- Añadir `Operaciones → Compras` al menú de `INVENTARIO` en `src/app/system-portal/services/control-access/system-menu.service.ts` y una ruta protegida bajo `/admin/inventario/compras` en `src/app/inventario/inventario.routes.ts`.
- Mostrar un listado paginado con búsqueda por proveedor o serie/número, orden reciente primero, columnas de comprobante, proveedor, almacén, cantidad de renglones y total en PEN, y acceso a consultar cada compra.
- Mostrar formulario de nueva compra con proveedor existente, almacén activo, tipo (`Factura`, `Boleta`, `Otro`), fecha, serie, número, observaciones opcionales y renglones de variante, cantidad, unidad y precio de compra; permitir añadir y quitar renglones.
- Buscar variantes activas por nombre/SKU sin cargar todo el catálogo; ofrecer solo unidades válidas para el producto y mostrar conversión, subtotal y total calculado. Permitir varios renglones de la misma variante.
- Adjuntar opcionalmente un solo PDF/JPG/PNG de hasta 10 MB, mostrar su nombre y permitir quitarlo antes de confirmar; si no quedó adjunto, ofrecer subida posterior desde la consulta de compra y descargarlo cuando exista.
- Confirmar y recibir con una sola acción; si el comprobante falla, mostrar claramente que la compra y el ingreso sí se guardaron, advertir que falta el archivo y ofrecer reintentar su subida sin reenviar la compra.
- Respetar tema `ferreteria`/`light`, tokens y patrones de `DESIGN.md` con Angular 22, Tailwind 4 y daisyUI 5; cubrir escritorio y móvil, estados de carga, vacío, error, validación y navegación por teclado.

**Out of scope (for future specs):**

- Botón “Guardar borrador” y persistencia de formularios incompletos.
- Modificar el botón deshabilitado de `src/app/inventario/pages/producto-prueba/producto-prueba-page.html`.
- Alta/edición o página de proveedores; recepción parcial/posterior, edición/anulación de compras y múltiples archivos.
- Dashboard, indicadores globales de compras, pagos e historial general de movimientos.

## Data model

- Contratos en `src/app/api/interfaces/inventario/`: `ProveedorResponse` (`id`, `nombre`, `documento`, `contacto`), `VarianteCompraResponse` (producto, SKU, unidad base y unidades con `factorABase`), `CompraResponse` (documento, fecha, proveedor, almacén, renglones, total, ingreso y comprobante opcional), respuesta de creación con `comprobante.estado: 'adjuntado' | 'pendiente' | 'fallido'` y `advertencia` opcional, y respuestas paginadas según SPEC 01.
- Formulario local en `src/app/inventario/pages/compras/`: `proveedorId`, `almacenId`, `tipoDocumento`, `fecha`, `serieDocumento`, `numeroDocumento`, `observaciones`, `renglones: { varianteId, unidadId, cantidad, precioUnitario }[]` y `comprobante: File | null`. No enviar `usuarioId`, `factorABase`, `costoTotal` ni un total autoritativo: los determina la API.
- API en `src/app/api/inventario/`: consultas de compras/proveedores/variantes, `POST` multipart de compra con archivo opcional, `POST /api/compras/:id/comprobante` para adjunto pendiente y descarga autenticada como `Blob`. Acciones en `src/app/inventario/actions/` usan TanStack Query con claves que incluyan página/búsqueda e `injectMutation` para crear y adjuntar.
- Estado local mediante señales para filtros, página, formulario y archivo. Las respuestas remotas permanecen en TanStack Query; invalidar solo consultas de compras afectadas al confirmar.

## Implementation plan

1. Añadir códigos `COMPRAS_LEER`, `COMPRAS_CREAR` y `PROVEEDORES_LEER` al contrato de permisos del frontend y crear interfaces y servicios API de solo lectura para proveedores, variantes de compra y compras, con pruebas de URL y parámetros.
2. Crear acciones TanStack Query con claves de paginación/búsqueda y una mutación multipart de confirmación; probar invalidación y errores sin duplicar estado remoto en señales.
3. Añadir ruta y menú de compras protegidos por `COMPRAS_LEER`, con pruebas de visibilidad y navegación; ocultar la acción de crear sin `COMPRAS_CREAR` y comprobar el permiso también al ejecutarla.
4. Construir listado de compras en `src/app/inventario/pages/compras/` con búsqueda, paginación, carga, vacío y error; mostrar únicamente datos devueltos por la API.
5. Incorporar formulario de nueva compra con consulta de proveedores y almacenes, selector buscable de variantes, unidades válidas, renglones repetibles, conversiones, subtotal y total; bloquear confirmación sin proveedor, almacén o renglón válido y explicar cómo proceder cuando no hay proveedores.
6. Incorporar selección, validación y retirada de archivo opcional con patrones de `src/app/shared/components/file-upload/`; confirmar por multipart y distinguir error de compra de advertencia por adjunto fallido. Tras `estado: 'fallido'`, conservar el ID, informar que el stock ya se recibió y ofrecer ir al detalle para reintentar.
7. Incorporar consulta de compra, subida posterior si no existe archivo y descarga privada si existe; tras adjuntar, invalidar solo el detalle afectado. Completar pruebas de permisos, validación, estados y respuesta móvil con los temas `ferreteria` y `light`.

## Acceptance criteria

- [ ] Usuarios con `COMPRAS_LEER` ven `Operaciones → Compras` y pueden abrir la ruta; sin él no ven el enlace ni acceden a la pantalla.
- [ ] Usuarios con `COMPRAS_LEER` y sin `COMPRAS_CREAR` pueden consultar compras, pero no confirmar una nueva; la comprobación se repite al ejecutar la acción.
- [ ] El listado consulta la API con página y texto de búsqueda, muestra primero las compras recientes y presenta carga, error con reintento y vacío diferenciados.
- [ ] El formulario carga proveedores existentes, almacenes activos y variantes mediante búsqueda; si no hay proveedores muestra una explicación y bloquea la confirmación sin ofrecer alta de proveedor.
- [ ] Elegir variante limita las unidades a las válidas de su producto; cantidad y precio generan subtotales y total visible en PEN, y se admiten renglones repetidos de una variante.
- [ ] No se puede confirmar sin proveedor, almacén, tipo, fecha, serie, número, al menos un renglón, cantidad positiva y precio no negativo; cada error aparece junto al campo correspondiente.
- [ ] Seleccionar un archivo válido es opcional; un tipo distinto a PDF/JPG/PNG o tamaño mayor de 10 MB presenta error de adjunto antes del envío, sin impedir confirmar la compra sin ese archivo, y el archivo puede retirarse.
- [ ] “Confirmar compra y recibir” envía un solo multipart; deshabilita el doble envío y únicamente muestra éxito y refresca la lista cuando la API confirma compra e ingreso.
- [ ] Un documento duplicado u otro error de compra deja la pantalla editable y no afirma que se haya recibido stock; una respuesta HTTP 201 con `estado: 'fallido'` afirma que la compra y el stock sí se registraron, muestra advertencia y no permite reenviar la compra como si hubiera fallado.
- [ ] La consulta de una compra muestra proveedor, almacén, documento, renglones, total e ingreso; si tiene archivo ofrece descarga con sesión, y si no lo tiene ofrece adjuntarlo posteriormente solo a quien posee `COMPRAS_CREAR`.
- [ ] Si falla la subida posterior, la compra permanece confirmada y se puede reintentar sin crear otro ingreso; si el archivo ya existe, no se ofrece reemplazarlo.
- [ ] La pantalla no contiene “Guardar borrador”; el botón de `producto-prueba` no cambia.
- [ ] La interfaz se puede usar por teclado y en móvil sin desbordamiento horizontal; respeta los temas y componentes del panel existente.
- [ ] `npm test -- --watch=false` y `npm run build` pasan en `front-tienda`; las pruebas cubren permisos, formulario, error y archivo opcional.

## Decisions

- **Yes:** tomar el orden y las tareas de la referencia como guía y aplicar la identidad visual actual de `DESIGN.md`; no copiar su estética ni sus datos locales.
- **Yes:** listado, formulario y consulta de compra con descarga; no incorporar dashboard ni página de proveedores.
- **No:** “Guardar borrador”, incluso si aparece en la referencia; las compras solo se registran al confirmar y recibir.
- **Yes:** un archivo opcional PDF/JPG/PNG de hasta 10 MB con reintento posterior si falta; no ofrecer múltiples comprobantes ni reemplazo.
- **No:** tratar el fallo del archivo como fallo de la compra; se muestra éxito de recepción junto con advertencia del adjunto.
- **Yes:** búsqueda paginada de variantes y proveedores remotos; no cargar todo el catálogo de variantes en el navegador.
- **No:** modificar `producto-prueba`; su botón deshabilitado no pertenece al flujo de compras.
- **Yes:** permisos separados de compras/proveedores, sin asignación automática; la operación requiere además permisos existentes de lectura para consultar almacenes y variantes.

## Risks

| Risk                                                                                 | Mitigation                                                                                                                                |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC 01 o los permisos asignados manualmente aún no están disponibles.               | No usar datos ficticios como reemplazo; mostrar error de acceso/carga y documentar los permisos necesarios.                               |
| La confirmación tarda y el usuario intenta enviarla otra vez.                        | Bloquear el botón durante el envío y mostrar error de documento duplicado cuando la API detecte un reintento posterior.                   |
| Se pierde la respuesta tras confirmar, pero antes de informar del fallo del archivo. | Buscar la compra por sus datos documentales antes de reintentar; la subida posterior usa el ID recuperado y nunca repite la confirmación. |
| Los cálculos de la vista difieren por redondeo del resultado persistido.             | Tratar el total de la API como fuente final y usar decimales, no sumar importes binarios de coma flotante.                                |

## What is **not** in this spec

- Ninguna API nueva fuera de las definidas en SPEC 01 ni gestión de proveedores.
- Ningún borrador, recepción parcial, pago, edición o anulación de compras.
- Ningún cambio a la pantalla de prueba de productos.
