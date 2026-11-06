# SPEC 19 — Cobro de venta

> **Status:** Aprobado
> **Depends on:** Ninguna especificación local.
> **Date:** 2026-11-06
> **Objective:** Registrar desde el diálogo de cobro una venta pagada con efectivo o Yape mediante la API de ventas.

## Scope

**In:**

- Conectar `src/app/ventas/pages/punto-venta/components/cobro-dialog/` con `POST /api/ventas` usando el turno y el almacén seleccionados, las líneas del carrito y un único medio de pago.
- Conservar las validaciones actuales de efectivo y Yape, los montos rápidos y el cálculo de vuelto previo; impedir pagos o ventas de total cero y solicitudes sin selección o líneas válidas.
- Enviar una clave de idempotencia única por intento y gestionar de forma segura las solicitudes pendientes o de resultado incierto durante la vida de la aplicación en memoria.
- Al confirmar el éxito, vaciar el carrito, actualizar el catálogo afectado y permanecer en el punto de venta; mostrar en un diálogo de confirmación el total y el vuelto reales de la respuesta hasta que el vendedor lo cierre.
- Conservar el carrito ante rechazos concluyentes, mostrar el motivo disponible y permitir corregir los datos; actualizar el catálogo ante stock insuficiente.
- Si el turno está cerrado, permitir volver a preparación conservando el carrito y el almacén para elegir otro turno y regresar al cobro.
- Contemplar envío en curso, errores, reintentos, accesibilidad y prevención de envíos duplicados.

**Out of scope (for future specs):**

- Modificar `api-tienda`, su contrato, sus permisos o sus reglas de precios y existencias.
- Pagos mixtos, medios adicionales, crédito, descuentos, promociones y ventas de total cero.
- Comprobantes, impresión, consulta, edición, anulación o devolución de ventas.
- Persistencia del carrito o de solicitudes pendientes tras una recarga o cierre de pestaña; recuperación automática después de perder el estado en memoria.
- Confirmar el precio mostrado antes de registrar la venta o impedir que la API aplique el precio vigente.
- Cambiar de almacén durante la recuperación de un turno cerrado.

## Data model

- El contrato existente está en `api-tienda/specs/venta/03-registrar-venta.md` y en `api-tienda/src/features/sales/ventas/`. Es una referencia externa, no una dependencia de otra spec de este repositorio.
- Crear los tipos HTTP en `src/app/api/interfaces/ventas/` para el cuerpo y la respuesta real de venta creada. El cuerpo tiene esta forma:

  ```ts
  {
    turnoId: string;
    almacenId: string;
    detalles: {
      varianteId: string;
      unidadId: string;
      cantidad: string;
    }
    [];
    pagos: {
      medio: 'efectivo' | 'yape';
      importe: string;
    }
    [];
  }
  ```

- `pagos` contiene exactamente un elemento en esta interfaz. Los identificadores proceden de `PreparacionVentaService` y del carrito; cantidades e importes viajan como cadenas decimales, sin convertir importes mediante punto flotante. El cliente no envía precios, total, vuelto ni propiedades adicionales.
- La respuesta tipada reproduce el contrato real, incluidos `id`, `fecha`, `estado`, `turnoId`, `almacenId`, `usuarioId`, importes como cadenas, detalles, pagos y `vuelto: { id, medio, importe, fecha } | null`. Un vuelto `null` se presenta como cero.
- Añadir un cliente HTTP bajo `src/app/api/ventas/` para `POST /ventas` con el encabezado obligatorio `Idempotency-Key`, y una mutación TanStack Query en `src/app/ventas/actions/`. Invalidar las consultas afectadas, incluido el catálogo del almacén, sin invalidar indiscriminadamente toda la caché.
- Mantener en memoria una instantánea inmutable de cuerpo, clave y usuario autenticado para cada intento enviado. La clave debe ser única para cada nuevo intento; repetir una operación incierta reutiliza exactamente la misma clave y el mismo cuerpo. Nunca reutilizar la clave con un cuerpo modificado ni con otro usuario.
- Ajustar el ciclo de vida de `CarritoVentaService` y la navegación de preparación para preservar las líneas al cambiar exclusivamente de turno tras el rechazo. La conservación es en memoria; no añadir almacenamiento persistente.

## Implementation plan

1. Incorporar tipos y cliente HTTP del contrato existente, con encabezado de idempotencia y decimales como cadenas. Probar ruta, cuerpo, encabezado y respuesta sin alterar otras operaciones.
2. Añadir la mutación de venta y la gestión en memoria de la instantánea, la clave y el usuario. Distinguir confirmación, rechazo concluyente y resultado incierto; probar que reintentos idénticos no generan una nueva clave ni alteran el cuerpo.
3. Conectar el formulario existente a la mutación, conservando efectivo y Yape como alternativas excluyentes. Validar nuevamente selección, carrito, importe positivo y condiciones del medio al ejecutar la acción; deshabilitar el envío repetido mientras está en curso.
4. Ante éxito, cerrar el cobro, limpiar el carrito e invalidar el catálogo afectado. Mostrar una confirmación persistente y accesible con el total y el vuelto de la respuesta, no con los cálculos previos del cliente.
5. Para rechazos concluyentes, conservar las líneas y mostrar el motivo. Ante stock insuficiente, actualizar el catálogo y permitir quitar líneas y volver a agregarlas con cantidades válidas; permitir un nuevo intento corregido con clave nueva.
6. Ante turno cerrado, habilitar el regreso a preparación con el carrito y almacén conservados, limitar esta recuperación a seleccionar otro turno abierto y volver al punto de venta. Probar que el carrito sobrevive a la navegación y que no se cambia de almacén en este flujo.
7. Mientras la solicitud esté en curso o su resultado sea incierto, impedir el cierre accidental y la navegación interna que destruiría el estado. Para recarga o cierre de pestaña, activar la advertencia del navegador y explicar la pérdida de recuperación; ante errores de red o HTTP 5xx ofrecer solo el reintento idéntico con el mismo usuario.
8. Cubrir las pruebas relevantes del cliente, acción, diálogo, carrito y navegación, incluidos errores, permisos vigentes, sesión, accesibilidad y ambos temas; ejecutar únicamente las pruebas de los componentes y servicios modificados. No ejecutar build.

## Acceptance criteria

- [ ] Con selección válida y carrito no vacío, «Registrar cobro» envía una sola solicitud con turno, almacén, líneas y un pago en `efectivo` o `yape`, además de una clave `Idempotency-Key` no vacía.
- [ ] Las cantidades y el importe enviado son cadenas decimales; no se envían precio, total ni vuelto calculados por el cliente.
- [ ] Se rechazan importes inválidos, cero, efectivo insuficiente y Yape distinto al total mostrado; los accesos rápidos y el vuelto previo en efectivo siguen funcionando.
- [ ] El botón no envía otra solicitud al pulsarse repetidamente mientras hay una en curso; el diálogo no se cierra por cancelar, Escape o clic fuera durante el envío o un resultado incierto.
- [ ] Una respuesta exitosa vacía el carrito, actualiza el catálogo afectado, cierra el diálogo de cobro y deja al vendedor en el punto de venta.
- [ ] Una confirmación visible hasta cerrarla muestra el total y el vuelto devueltos por la API, incluido cero cuando `vuelto` es `null`, aunque el total real difiera del mostrado antes de enviar.
- [ ] Un rechazo concluyente conserva el carrito y muestra el motivo disponible; tras corregirlo, el nuevo intento usa una clave distinta.
- [ ] Ante stock insuficiente se actualiza el catálogo y el vendedor puede quitar líneas y volver a agregarlas con cantidades válidas sin perder las demás líneas.
- [ ] Ante turno cerrado se conserva el carrito al ir a preparación, se mantiene el almacén, se selecciona otro turno abierto y las mismas líneas aparecen al regresar al punto de venta.
- [ ] Un error de red o HTTP 5xx deja el resultado como incierto, bloquea cambios y ofrece un reintento con exactamente la misma clave, cuerpo y usuario; un éxito recuperado no registra una segunda venta.
- [ ] Una sesión distinta no puede reintentar una operación incierta; si no se puede recuperar la sesión del mismo usuario, se advierte que se debe verificar manualmente el resultado.
- [ ] Mientras hay un envío en curso o incierto, la navegación interna no destruye la operación y recargar o cerrar la pestaña activa la advertencia del navegador; se informa que continuar pierde la recuperación en memoria.
- [ ] Un conflicto de clave de idempotencia no se presenta como éxito ni provoca el envío automático con otra clave; se conserva el estado y se informa que requiere revisión.
- [ ] El diálogo y la confirmación tienen nombre accesible, funcionan con teclado y muestran los estados y errores sin depender solo del color; no desbordan a 390 px en `ferreteria` ni `light`.
- [ ] Pasan las pruebas relevantes de los archivos modificados sin ejecutar el conjunto completo ni un build.

## Decisions

- **Sí:** usar una sola solicitud existente para registrar venta, pago y salida de inventario; el servidor conserva la autoridad sobre los precios y el stock.
- **Sí:** mantener un único medio por venta en esta interfaz, aunque la API admita pagos mixtos, para conservar el alcance y el formulario actuales.
- **Sí:** mostrar el total y vuelto reales en un diálogo de éxito persistente, sin introducir una confirmación previa del precio que la API no garantiza.
- **Sí:** conservar en memoria clave y solicitud inmutable ante un resultado incierto; reintentar solo como el mismo usuario porque la idempotencia está asociada a él.
- **Sí:** advertir antes de abandonar una operación pendiente, con la limitación de que una salida confirmada pierde la recuperación en memoria.
- **Sí:** conservar el carrito y el almacén al cambiar el turno cerrado; no trasladar sin validación las líneas a otro almacén.
- **No:** persistir solicitudes pendientes entre sesiones ni añadir consultas de ventas; requieren un alcance adicional.
- **No:** ejecutar build ni todas las pruebas; se siguen las instrucciones vigentes del repositorio para los archivos modificados.

## Risks

| Risk                                                                      | Mitigation                                                                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| La respuesta se pierde después de registrar la venta.                     | Conservar y reintentar el mismo cuerpo y clave para el mismo usuario; bloquear cambios mientras el resultado sea incierto.      |
| El usuario fuerza una recarga o cierra la pestaña con resultado incierto. | Advertir antes de salir e informar que la clave en memoria se pierde y que debe verificar manualmente antes de volver a cobrar. |
| El precio vigente difiere del mostrado y la venta ya está registrada.     | Presentar el total y vuelto reales de la respuesta; la API puede rechazar pagos insuficientes o vuelto no permitido.            |
| El turno o las existencias cambian durante el cobro.                      | Mostrar el rechazo, conservar el carrito y permitir corregir turno o líneas; la API valida de nuevo al registrar.               |

## What is **not** in this spec

- Cambios en la API, pagos mixtos, nuevos medios, comprobantes o gestión posterior de ventas.
- Confirmación previa del precio, recuperación tras recargar o cambio de almacén durante la recuperación del turno.
