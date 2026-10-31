# SPEC 18 — Modal de cierre de turno

> **Status:** Aprobado
> **Depends on:** SPEC 02 de `api-tienda/specs/venta/02-resumen-cierre-turno.md`
> **Date:** 2026-10-31
> **Objective:** Permitir revisar el desglose y cerrar un turno de caja mediante un modal conectado a la API.

## Scope

**In:**

- Activar «Cerrar turno» en la tarjeta de una caja con turno abierto y mostrar un diálogo basado en la imagen de referencia, adaptado a `DESIGN.md` y a ambos temas.
- Mostrar el desglose real de la API, efectivo contado, diferencia y observación opcional de hasta 500 caracteres.
- Permitir cerrar con faltante o sobrante, mostrando la diferencia antes de confirmar.
- Reconsultar el resumen al confirmar y solicitar una nueva confirmación si el total cambia. Enviar el total confirmado y manejar el conflicto de concurrencia de la API.
- Cerrar el diálogo y actualizar el listado tras el éxito; contemplar carga, error, reintento y turno cerrado por otro usuario.

**Out of scope (for future specs):**

- Nueva pantalla de historial, cierre de día, denominaciones y modificaciones de la API distintas de SPEC 02.

## Data model

- Extender `src/app/api/interfaces/ventas/caja-turno.interface.ts` con el resumen definido en SPEC 02 y los campos `efectivoEsperadoConfirmado` y `observacionCierre` del DTO de cierre.
- Extender `TurnoCaja` en `src/app/api/interfaces/ventas/caja.interface.ts` con `observacionCierre: string | null`.
- Añadir el cliente de resumen en `src/app/api/ventas/caja-turnos/caja-turnos-api.ts` y una consulta TanStack Query con clave que incluya caja y turno en `src/app/ventas/actions/use-caja-turnos-action.ts`. Conservar la mutación existente y su invalidación del listado.
- Mantener formulario y confirmación en señales locales. No duplicar la respuesta remota en estado local salvo la instantánea necesaria para comparar el total confirmado. Calcular diferencias sin errores de punto flotante.

## Implementation plan

1. Reflejar el contrato de SPEC 02 en interfaces, cliente HTTP y acción de consulta; probar ruta, claves y carga de resumen.
2. Crear `src/app/ventas/pages/cajas-turnos/components/cerrar-turno-dialog/` con diálogo, desglose, formulario y estados de carga y error; reutilizar el shell de diálogos y las convenciones de accesibilidad existentes.
3. Conectar el botón de `components/caja-card/` al diálogo para el turno abierto; conservar el comportamiento de apertura cuando no exista turno abierto.
4. Validar importe no negativo con hasta dos decimales y observación de hasta 500 caracteres; mostrar diferencia con signo y permitir confirmar cualquier diferencia.
5. Reconsultar antes de cerrar; si cambia el total, mostrar el nuevo resumen y exigir otra confirmación. Enviar el total confirmado y manejar por separado el conflicto `EFECTIVO_ESPERADO_CAMBIO` con reconsulta y nueva confirmación.
6. Al éxito cerrar el diálogo y aprovechar la invalidación y confirmación de la mutación existente; probar errores, permisos vigentes, estados pendientes y prevención de envíos duplicados.
7. Ejecutar pruebas relevantes y compilación; revisar teclado, 390 px y escritorio en `ferreteria` y `light`.

## Acceptance criteria

- [ ] Una tarjeta con turno abierto permite abrir el diálogo de cierre; una caja sin turno conserva la acción de apertura.
- [ ] El diálogo muestra los seis componentes y el efectivo esperado devueltos para el turno seleccionado; carga y errores nunca se representan como cero.
- [ ] El contado admite cero y valores no negativos con hasta dos decimales; rechaza valores inválidos y observaciones de más de 500 caracteres.
- [ ] La diferencia es contado menos esperado y se permite cerrar con faltante, sobrante o diferencia cero.
- [ ] Si el total cambia al reconsultar, no se cierra hasta una nueva confirmación; si solo cambia el desglose y el total no cambia, no se exige otra confirmación.
- [ ] Un conflicto de total devuelto por la API no cierra el diálogo ni pierde lo escrito; se muestra el nuevo resumen antes de volver a confirmar.
- [ ] El éxito cierra el diálogo, muestra confirmación y actualiza el listado; un fallo conserva los datos y permite reintentar.
- [ ] El diálogo tiene nombre accesible, foco visible y restaurado, funciona con teclado y no desborda a 390 px en ambos temas.
- [ ] Pasan las pruebas relevantes y `npm run build`.

## Decisions

- **Sí:** usar el desglose real de la API en lugar de valores simulados.
- **Sí:** permitir diferencias con aviso y observación opcional persistida.
- **Sí:** comparar el total antes del envío y exigir que la API lo verifique otra vez al cerrar.
- **No:** crear una pantalla de historial ni confirmar de nuevo cuando únicamente cambia el desglose con el mismo total.

## Risks

| Risk                                                        | Mitigation                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| El resumen cambia entre consulta y cierre.                  | La API verifica el total en la transacción y el diálogo maneja el conflicto. |
| La resta en punto flotante muestra diferencias incorrectas. | Usar aritmética decimal exacta y probar importes con centavos.               |

## What is **not** in this spec

- Nueva interfaz de historial, cierre de día y desglose por denominaciones.
