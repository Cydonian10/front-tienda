# SPEC 10 — Rol responsable y permisos operativos

> **Status:** Implementado
> **Depends on:** SPEC 08 (página de ventas y cobro), SPEC 09 (ventas por unidad de medida), API `ApiTienda` SPEC 12 (autenticación y guards), API `ApiTienda` SPEC 16 (cajas, sesiones y cierres), API `ApiTienda` SPEC 17 (ventas pendientes, pago y cancelación)
> **Date:** 2026-09-12
> **Objective:** Incorporar el rol operativo `RESPONSABLE` y aplicar su matriz de permisos en ventas, caja, consultas y mantenimiento.

## Why this spec exists

El campo `CashRegisterOpening.responsible` identifica a una persona asignada a una sesión, pero no otorga permisos de supervisión.

El nuevo rol separa la operación limitada de `TRABAJADOR` del control diario que necesita una persona responsable sin otorgarle mantenimiento administrativo.

## Scope

**In:**

- Agregar el rol persistido `RESPONSABLE` junto a `ADMINISTRADOR`, `TRABAJADOR` y `CLIENTE`.
- Crear una migración nueva que inserte el rol de forma idempotente.
- Actualizar el seed y las validaciones de personas para que una persona con `RESPONSABLE` requiera credenciales igual que el personal operativo actual.
- Permitir que `RESPONSABLE` realice ventas, abra, opere y cierre sesiones de caja, y consulte todas las ventas, sesiones y movimientos.
- Limitar `TRABAJADOR` a ventas, sesiones y movimientos donde `CashRegisterOpening.responsible.id` sea su persona autenticada.
- Permitir a `TRABAJADOR` cancelar únicamente una venta `PENDING` propia.
- Permitir a `RESPONSABLE` y `ADMINISTRADOR` cancelar una venta `PAID` mientras la sesión siga abierta.
- Mantener para `ADMINISTRADOR` el acceso completo a mantenimiento, cajas y operaciones.
- Restringir el mantenimiento de productos, categorías, marcas, atributos, unidades y métodos de pago a `ADMINISTRADOR`.
- Actualizar los decoradores `@Roles(...)` y las comprobaciones de servicio necesarias para que la autorización del API sea la fuente de verdad.
- Actualizar modelos y controles visibles de Angular para reconocer `RESPONSABLE` sin convertir el ocultamiento visual en autorización.
- Añadir pruebas unitarias y de controlador para la matriz de permisos modificada.

**Out of scope (for future specs):**

- CRUD de roles desde la interfaz.
- Configuración de permisos personalizados por usuario.
- Flujo de aprobación para anulaciones o movimientos.
- Reversión de una anulación de venta.
- Revocación inmediata de JWT emitidos antes de cambiar los roles de una persona.

## Data model

No se crea una entidad nueva. `Role.name` continúa siendo la fuente de roles persistidos.

```ts
// ApiTienda: valor persistido en la tabla role
export type OperationalRole = 'ADMINISTRADOR' | 'RESPONSABLE' | 'TRABAJADOR' | 'CLIENTE';

// FrontTienda/src/app/core/models/auth.model.ts
export interface AuthUser {
  id: number;
  email: string;
  personId: number;
  roles: OperationalRole[];
}
```

Matriz de autorización definitiva:

| Acción                                        | TRABAJADOR | RESPONSABLE | ADMINISTRADOR |
| --------------------------------------------- | ---------- | ----------- | ------------- |
| Crear, editar y cobrar venta en sesión propia | Sí         | Sí          | Sí            |
| Consultar ventas propias                      | Sí         | Sí          | Sí            |
| Consultar ventas de otras personas            | No         | Sí          | Sí            |
| Cancelar `PENDING` propia                     | Sí         | Sí          | Sí            |
| Cancelar `PAID`                               | No         | Sí          | Sí            |
| Abrir, mover y cerrar sesión propia asignada  | Sí         | Sí          | Sí            |
| Consultar sesiones y movimientos ajenos       | No         | Sí          | Sí            |
| Consultar reportes                            | No         | Sí          | Sí            |
| Mantenimiento                                 | No         | No          | Sí            |

Convenciones:

- Una persona puede tener varios roles porque la relación actual es muchos a muchos.
- `RESPONSABLE` es un cuarto rol independiente y no sustituye ni implica automáticamente `TRABAJADOR`.
- Para controles de propiedad, una sesión propia se determina por `opening.responsible.id === user.personId`, no por `openedBy`.
- Un cambio de roles requiere iniciar sesión otra vez para obtener un JWT que contenga los roles actualizados.
- La excepción administrativa existente se conserva donde corresponda; el rol `RESPONSABLE` no recibe permisos de mantenimiento por herencia.

Archivos principales:

- `ApiTienda/src/database/migrations/<timestamp>-AddResponsibleRole.ts`.
- `ApiTienda/src/modules/seed/seed.service.ts`.
- `ApiTienda/src/modules/people/services/people.service.ts`.
- `ApiTienda/src/modules/people/dtos/person/create-person.dto.ts`.
- `ApiTienda/src/modules/people/dtos/person/update-person.dto.ts`.
- `ApiTienda/src/modules/sales/controllers/sales.controller.ts`.
- `ApiTienda/src/modules/sales/services/sales.service.ts`.
- `ApiTienda/src/modules/cash/controllers/*.controller.ts`.
- `ApiTienda/src/modules/cash/services/cash-register-openings.service.ts`.
- `ApiTienda/src/modules/cash/services/cash-movements.service.ts`.
- `FrontTienda/src/app/core/models/auth.model.ts`.
- Pruebas de personas, ventas y caja en ambos repositorios.

## Implementation plan

1. Crear la migración de `ApiTienda` que inserte `RESPONSABLE` con `ON CONFLICT DO NOTHING` y verificar que no modifica roles existentes.
2. Actualizar el seed y la lógica `STAFF_ROLES` de personas para reconocer `RESPONSABLE` como personal con email y contraseña obligatorios.
3. Crear una constante o tipo central de nombres de rol en cada repositorio para eliminar comparaciones dispersas no tipadas.
4. Ajustar los controladores de ventas y caja para permitir `RESPONSABLE` en las rutas operativas y de consulta aplicables.
5. Ajustar los servicios de ventas para que las consultas globales y la anulación `PAID` se autoricen solo a `RESPONSABLE` o `ADMINISTRADOR`.
6. Ajustar los servicios de apertura y movimientos para que `TRABAJADOR` opere exclusivamente sesiones donde sea `responsible`, mientras `RESPONSABLE` y `ADMINISTRADOR` conservan visibilidad global.
7. Mantener los endpoints de mantenimiento con `@Roles('ADMINISTRADOR')` y cubrir cualquier ruta que hoy no tenga restricción explícita.
8. Actualizar los modelos y condiciones de interfaz que hoy distinguen solamente `ADMINISTRADOR` y `TRABAJADOR`.
9. Añadir pruebas de migración, creación de personal, JWT, ventas, anulaciones, aperturas y movimientos para cada fila aplicable de la matriz.
10. Ejecutar `npm run build` y `npm test` en `FrontTienda`, y `npm run build`, `npm test` y revisión de los cambios de formato en `ApiTienda`.

## Acceptance criteria

- [ ] La migración agrega exactamente un rol `RESPONSABLE` y puede ejecutarse sobre una base que ya lo contiene.
- [ ] El seed puede crear y autenticar una persona con rol `RESPONSABLE`.
- [ ] Crear o editar una persona con `RESPONSABLE` sin email o contraseña recibe un error de validación.
- [ ] El JWT y `GET /auth/me` devuelven `RESPONSABLE` dentro de `roles` para esa persona.
- [ ] Un `RESPONSABLE` puede crear, editar y cobrar una venta en una sesión donde es responsable.
- [ ] Un `RESPONSABLE` puede consultar ventas de otros vendedores.
- [ ] Un `TRABAJADOR` solo recibe ventas donde es el vendedor, aunque envíe otro `sellerId`.
- [ ] Un `TRABAJADOR` puede cancelar una venta `PENDING` propia y recibe `403` al cancelar una `PAID`.
- [ ] Un `RESPONSABLE` y un `ADMINISTRADOR` pueden cancelar una venta `PAID` con sesión abierta.
- [ ] Un `TRABAJADOR` no puede consultar, crear movimientos ni cerrar una sesión cuyo responsable sea otra persona.
- [ ] Un `RESPONSABLE` puede consultar sesiones y movimientos de todas las personas.
- [ ] Un `RESPONSABLE` recibe `403` en endpoints de mantenimiento reservados a `ADMINISTRADOR`.
- [ ] La interfaz reconoce el rol sin exponer mantenimiento a un responsable.
- [ ] Las pruebas y builds definidos pasan correctamente.

## Decisions

- **Sí:** agregar `RESPONSABLE` como cuarto rol persistido para preservar los perfiles actuales de trabajador y administrador.
- **Sí:** usar `responsible.id` como propiedad operacional de una sesión, porque `openedBy` puede ser un administrador que abrió la caja para otra persona.
- **Sí:** restringir anulación `PAID` a responsable y administrador para proteger el arqueo y el control interno.
- **Sí:** mantener la anulación de una `PENDING` propia para trabajador, porque todavía no afectó stock ni caja.
- **Sí:** tratar responsable como personal con credenciales para que pueda autenticarse y operar.
- **No:** dar mantenimiento a responsable; ese acceso sigue siendo administrativo.
- **No:** sustituir automáticamente roles existentes ni asignar roles múltiples en la migración.
- **No:** implementar aprobaciones de operaciones; requieren estados y auditoría adicionales.

## Risks

| Riesgo                                                            | Mitigación                                                                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Un endpoint conserva la lista antigua de roles.                   | Buscar y cubrir decoradores, constantes y servicios con pruebas por rol.                                       |
| Un usuario sigue usando un JWT emitido antes del cambio de roles. | Requerir nuevo inicio de sesión y documentar que el token es la instantánea de autorización.                   |
| Se confunden `openedBy` y `responsible`.                          | Centralizar la regla de propiedad sobre `responsible.id` y probar el caso de apertura hecha por administrador. |

## What is **not** in this spec

- Administración visual de usuarios, roles o configuración.
- Permisos configurables por tienda o persona.
- Aprobaciones de anulaciones o movimientos.
- Revocación de tokens ya emitidos.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
