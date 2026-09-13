# SPEC 11 — Navegación y rutas por rol

> **Status:** Borrador
> **Depends on:** SPEC 10 (rol responsable y permisos operativos)
> **Date:** 2026-09-12
> **Objective:** Reorganizar la navegación en áreas de primer nivel y proteger cada ruta Angular según los roles autorizados.

## Scope

**In:**

- Crear `roleGuard` para rutas Angular que exija autenticación y al menos uno de los roles declarados en `Route.data`.
- Mantener `authGuard` para la sesión y usar `roleGuard` como defensa adicional de navegación.
- Extender `MenuItem` con los roles que pueden ver cada entrada.
- Filtrar el menú recursivamente en `DashboardService` con los roles de `AuthStore.user()`.
- Reemplazar las rutas de operaciones por las áreas de primer nivel `/ventas`, `/caja`, `/reportes` y `/administracion`.
- Crear entradas de menú: Inicio, Ventas, Caja, Reportes, Mantenimiento y Administración.
- Configurar accesos: todos los usuarios operativos ven Inicio; trabajador ve Nueva venta y Mi caja; responsable y administrador ven historial, sesiones, movimientos y reportes; mantenimiento solo lo ve administrador.
- Agregar Administración como grupo de navegación que solo enlaza recursos ya implementados; Configuración no tendrá ruta ni pantalla en esta entrega.
- Eliminar las rutas antiguas `/operaciones/ventas` y `/operaciones/cajas` en lugar de conservar redirecciones de compatibilidad.
- Mostrar una pantalla de acceso denegado o redirigir de forma consistente a una ruta autorizada cuando el guard bloquee una URL.
- Añadir pruebas unitarias de guarda, filtrado de menú y definición de rutas.

**Out of scope (for future specs):**

- CRUD visual de trabajadores y roles.
- Pantalla o persistencia de configuración de tienda.
- Rutas de contenido aún no implementado.
- Sustituir los controles de autorización del backend.
- Redirecciones para marcadores de las rutas antiguas.

## Data model

```ts
// FrontTienda/src/app/core/models/menu.model.ts
export interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  route?: string;
  expanded?: boolean;
  roles?: OperationalRole[];
  children?: MenuItem[];
}

// FrontTienda/src/app/core/guards/role.guard.ts
// Route.data['roles'] contiene OperationalRole[].
```

Mapa de rutas objetivo:

| Ruta | Roles |
| --- | --- |
| `/inicio` | ADMINISTRADOR, RESPONSABLE, TRABAJADOR |
| `/ventas/nueva` | ADMINISTRADOR, RESPONSABLE, TRABAJADOR |
| `/ventas/historial` | ADMINISTRADOR, RESPONSABLE |
| `/caja/mi-caja` | ADMINISTRADOR, RESPONSABLE, TRABAJADOR |
| `/caja/sesiones` | ADMINISTRADOR, RESPONSABLE |
| `/caja/movimientos` | ADMINISTRADOR, RESPONSABLE |
| `/reportes/**` | ADMINISTRADOR, RESPONSABLE |
| `/mantenimiento/**` | ADMINISTRADOR |
| `/administracion/**` | ADMINISTRADOR |

Convenciones:

- El guard acepta la intersección de roles, no una jerarquía implícita.
- La ausencia de `data.roles` no concede acceso; las nuevas rutas protegidas declaran roles explícitos.
- El menú se filtra después de restaurar el usuario mediante `GET /auth/me`.
- Ocultar una entrada no sustituye los `@Roles(...)` del API.

Archivos principales:

- `src/app/core/guards/role.guard.ts`.
- `src/app/core/models/menu.model.ts`.
- `src/app/core/models/auth.model.ts`.
- `src/app/core/services/dashboard.service.ts`.
- `src/app/app.routes.ts`.
- Nuevos archivos de rutas bajo `src/app/feature/ventas/`, `src/app/feature/caja/`, `src/app/feature/reportes/` y `src/app/feature/administracion/`.
- `src/app/layout/sidebar/`.
- Pruebas de guarda, servicio de menú y rutas.

## Implementation plan

1. Crear el tipo compartido de roles consumido por `AuthUser`, el menú y los datos de rutas.
2. Crear `roleGuard` que consulte `AuthStore.user()` y redirija la sesión ausente a login y los roles no autorizados a una ruta permitida.
3. Extender `MenuItem` y adaptar `DashboardService` para derivar un menú visible sin mutar la definición estática original.
4. Definir los grupos de menú y sus permisos según el mapa de rutas objetivo.
5. Crear módulos de rutas lazy para Ventas, Caja, Reportes y Administración con los guards de cada página.
6. Mover los enlaces existentes de Ventas y Cajas a las rutas nuevas sin crear redirecciones de `/operaciones/**`.
7. Mantener Mantenimiento bajo su ruta actual y protegerla con `roleGuard` para administrador.
8. Añadir pruebas unitarias para usuario no autenticado, trabajador, responsable, administrador y menú anidado.
9. Ejecutar `npm run build` y `npm test` en `FrontTienda`.

## Acceptance criteria

- [ ] Una URL protegida sin token redirige a `/auth/login`.
- [ ] Un trabajador no puede activar `/ventas/historial`, `/caja/sesiones`, `/caja/movimientos`, `/reportes/**`, `/mantenimiento/**` ni `/administracion/**`.
- [ ] Un responsable puede activar historial, sesiones, movimientos y reportes, pero no mantenimiento ni administración.
- [ ] Un administrador puede activar todas las rutas declaradas.
- [ ] El menú de trabajador no muestra historial, sesiones, movimientos, reportes, mantenimiento ni administración.
- [ ] El menú de responsable no muestra mantenimiento ni administración.
- [ ] El menú de administrador muestra todos los grupos que tengan rutas implementadas.
- [ ] Las rutas `/operaciones/ventas` y `/operaciones/cajas` dejan de estar registradas.
- [ ] Cada entrada visible navega a una ruta existente.
- [ ] El filtro de menú no modifica la definición base entre cambios de usuario.
- [ ] `npm run build` y `npm test` pasan.

## Decisions

- **Sí:** usar rutas de primer nivel para separar operación, caja, reportes y administración.
- **Sí:** aplicar un guard de roles y filtrar el menú desde una única definición.
- **Sí:** borrar rutas antiguas en vez de mantener compatibilidad innecesaria.
- **Sí:** dejar Administración como navegación de recursos existentes exclusivamente para administrador.
- **No:** mostrar enlaces a Configuración sin requisitos funcionales definidos.
- **No:** confiar en el menú como mecanismo de seguridad.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Una ruta lazy no declara roles. | Hacer obligatoria la revisión de `data.roles` y cubrirla con pruebas de rutas. |
| El usuario se restaura después de evaluar la ruta. | El guard espera el estado de autenticación restaurado o redirige de forma consistente. |
| Un enlace del menú apunta a una página futura. | Mostrar solo entradas cuya ruta esté registrada en esta entrega. |

## What is **not** in this spec

- Pantallas de historial, sesiones, movimientos o reportes.
- Administración funcional de trabajadores, roles o configuración.
- Cambios de permisos en NestJS.
- Compatibilidad con URLs de operaciones antiguas.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
