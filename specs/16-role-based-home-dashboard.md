# SPEC 16 — Inicio operativo por rol

> **Status:** Implementado
> **Depends on:** SPEC 10 (rol responsable y permisos operativos), SPEC 11 (navegación y rutas por rol), SPEC 12 (historial de ventas y resumen por período), SPEC 13 (mi caja, sesiones y movimientos), SPEC 14 (reportes de resumen, ventas y vendedores), SPEC 15 (reportes de productos, pagos y cajas)
> **Date:** 2026-09-12
> **Objective:** Convertir Inicio en un dashboard operativo que priorice la caja propia para trabajador y los indicadores generales para responsable y administrador.

## Scope

**In:**

- Reemplazar el contenido actual de Inicio por una composición dependiente del rol autenticado.
- Mostrar a trabajador el estado de su sesión propia, enlace a Nueva venta, ventas recientes propias y movimientos recientes de su sesión.
- Mostrar a responsable y administrador los KPI del período semanal actual: ventas cobradas, transacciones, ticket promedio, importe y conteo cancelado.
- Mostrar a responsable y administrador mejor vendedor, producto principal y distribución de métodos de pago obtenidos de los endpoints de reportes.
- Incluir enlaces a los reportes y rutas de caja autorizados para cada rol.
- Usar el rango de lunes a domingo de `America/Lima` en el resumen semanal inicial.
- Mantener estados de carga, vacío, error y reintento por bloque de información.
- No duplicar cálculos: Inicio consume contratos de ventas, caja y reportes ya creados.
- Validar los dashboards de trabajador, responsable y administrador con MCP de Playwright.

**Out of scope (for future specs):**

- Personalización de widgets por usuario.
- Configuración de períodos desde Inicio.
- Gráficos interactivos o comparaciones históricas.
- Actualización automática por sockets.
- Nueva API de dashboard que duplique reportes existentes.

## Data model

Esta spec no crea estructuras persistidas ni endpoints nuevos. Reutiliza:

- `SalesSummary`, `ReportsOverviewDto` y los contratos de SPEC 12, SPEC 14 y SPEC 15.
- `CashRegisterOpening` y `CashMovement` de SPEC 13.
- `AuthUser.roles` de SPEC 10.

Convenciones:

- Si una persona posee más de un rol, aplica el dashboard de mayor privilegio entre `ADMINISTRADOR`, `RESPONSABLE` y `TRABAJADOR`.
- El dashboard semanal cubre lunes 00:00 a domingo 23:59:59.999 de `America/Lima`.
- Cada tarjeta consume su endpoint específico y falla de forma aislada.
- Los enlaces solo aparecen si la misma ruta está autorizada por SPEC 11.

Archivos principales:

- `FrontTienda/src/app/feature/inicio/pages/inicio.page.ts` y `.html`.
- `FrontTienda/src/app/feature/inicio/components/worker-dashboard/`.
- `FrontTienda/src/app/feature/inicio/components/management-dashboard/`.
- `FrontTienda/src/app/core/api/reports.service.ts`.
- `FrontTienda/src/app/core/api/sales.service.ts`.
- `FrontTienda/src/app/core/api/cash-register-openings.service.ts`.
- `FrontTienda/src/app/core/api/cash-movements.service.ts`.
- Pruebas de página y componentes de Inicio.

## Implementation plan

1. Definir una función de selección de dashboard que resuelva los roles múltiples de forma determinista.
2. Crear los componentes de dashboard de trabajador y de supervisión, con contratos de entrada explícitos.
3. Implementar carga de sesión propia, ventas recientes y movimientos recientes para trabajador sin consultar datos ajenos.
4. Implementar carga concurrente y aislada de resumen semanal, overview y enlaces para responsable/admin usando los servicios existentes.
5. Añadir placeholders, estados vacíos, error y reintento por bloque sin ocultar los datos de otros bloques correctos.
6. Añadir pruebas para cada rol, sin sesión propia, semana sin ventas y error parcial de una consulta.
7. Ejecutar build y pruebas; usar MCP de Playwright para autenticar los tres perfiles y validar contenido, enlaces y consola.

## Acceptance criteria

- [ ] Un trabajador ve únicamente información de su sesión, ventas y movimientos propios.
- [ ] Un trabajador sin sesión propia recibe un enlace visible a `/caja/mi-caja`.
- [ ] Responsable y administrador ven KPI semanales basados en datos `PAID` y cancelaciones separadas.
- [ ] Responsable y administrador ven mejor vendedor, producto principal y métodos de pago desde APIs de reportes.
- [ ] Cada enlace mostrado apunta a una ruta permitida para el rol actual.
- [ ] Una consulta fallida muestra error y reintento sin borrar los bloques que sí cargaron.
- [ ] El rango semanal inicial respeta lunes a domingo en `America/Lima`.
- [ ] La página no implementa agregaciones financieras en Angular.
- [ ] MCP de Playwright valida los tres perfiles sin errores de consola.
- [ ] `npm run build` y `npm test` pasan en FrontTienda.

## Decisions

- **Sí:** diferenciar Inicio por rol para mostrar información accionable y no datos globales a trabajador.
- **Sí:** reutilizar los endpoints ya definidos para mantener una única fuente de cálculo.
- **Sí:** iniciar el dashboard administrativo con la semana operativa actual.
- **No:** crear un endpoint exclusivo de dashboard.
- **No:** permitir personalizar widgets o períodos en esta fase.
- **No:** activar sockets hasta SPEC 17.

## Risks

| Riesgo                                           | Mitigación                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| Varias solicitudes hacen lenta la carga inicial. | Cargar bloques en paralelo y mostrar estados independientes.       |
| Un usuario multirol recibe un dashboard ambiguo. | Aplicar prioridad explícita de rol y cubrirla con pruebas.         |
| Un enlace expone una ruta no autorizada.         | Reutilizar el mapa de permisos de SPEC 11 y validar con navegador. |

## What is **not** in this spec

- Personalización de dashboard.
- Gráficos avanzados y comparación entre períodos.
- Nuevas agregaciones de backend.
- Realtime.

Cada uno de esos cambios, si llega, debe definirse en su propia spec.
