import { Route, Routes } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { roleGuard } from './core/guards/role.guard';
import { ROLE_NAMES } from './core/models/role.model';
import administracionRoutes from './feature/administracion/administracion.routes';
import cajaRoutes from './feature/caja/caja.routes';
import reportesRoutes from './feature/reportes/reportes.routes';
import ventasRoutes from './feature/ventas/ventas.routes';
import { routes } from './app.routes';

const findRoute = (routes: Routes, path: string): Route => {
  const route = routes.find((item) => item.path === path);
  if (!route) throw new Error(`Route ${path} was not found`);
  return route;
};

describe('role-aware routes', () => {
  it('registers the new top-level areas and removes operations routes', () => {
    const layoutRoute = routes.find((route) => route.children);
    const childPaths = layoutRoute?.children?.map((route) => route.path);

    expect(childPaths).toEqual([
      'inicio',
      'mantenimiento',
      'ventas',
      'caja',
      'reportes',
      'administracion',
    ]);
    expect(childPaths).not.toContain('operaciones');
  });

  it('declares the expected guards and roles on every new route', () => {
    const operationalRoles = [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER];

    const inicioRoute = findRoute(routes.find((route) => route.children)?.children ?? [], 'inicio');
    const nuevaVentaRoute = findRoute(ventasRoutes, 'nueva');
    const historialVentasRoute = findRoute(ventasRoutes, 'historial');
    const miCajaRoute = findRoute(cajaRoutes, 'mi-caja');
    const sesionesRoute = findRoute(cajaRoutes, 'sesiones');
    const movimientosRoute = findRoute(cajaRoutes, 'movimientos');
    const reportesRootRoute = findRoute(reportesRoutes, '');
    const resumenReportesRoute = findRoute(reportesRoutes, 'resumen');
    const ventasReportesRoute = findRoute(reportesRoutes, 'ventas');
    const vendedoresReportesRoute = findRoute(reportesRoutes, 'vendedores');
    const productosReportesRoute = findRoute(reportesRoutes, 'productos');
    const metodosPagoReportesRoute = findRoute(reportesRoutes, 'metodos-pago');
    const cajasReportesRoute = findRoute(reportesRoutes, 'cajas');
    const administracionRoute = findRoute(administracionRoutes, '');

    expect(inicioRoute.canActivate).toContain(roleGuard);
    expect(inicioRoute.data?.['roles']).toEqual(operationalRoles);
    expect(
      findRoute(routes.find((route) => route.children)?.children ?? [], 'mantenimiento')
        .canActivate,
    ).toContain(roleGuard);
    expect(nuevaVentaRoute.canActivate).toContain(roleGuard);
    expect(nuevaVentaRoute.data?.['roles']).toEqual(operationalRoles);
    expect(historialVentasRoute.canActivate).toContain(roleGuard);
    expect(historialVentasRoute.data?.['roles']).toEqual([
      ROLE_NAMES.ADMINISTRATOR,
      ROLE_NAMES.RESPONSIBLE,
    ]);
    expect(miCajaRoute.canActivate).toContain(roleGuard);
    expect(miCajaRoute.data?.['roles']).toEqual(operationalRoles);
    expect(sesionesRoute.canActivate).toContain(roleGuard);
    expect(sesionesRoute.data?.['roles']).toEqual([
      ROLE_NAMES.ADMINISTRATOR,
      ROLE_NAMES.RESPONSIBLE,
    ]);
    expect(movimientosRoute.canActivate).toContain(roleGuard);
    expect(movimientosRoute.data?.['roles']).toEqual([
      ROLE_NAMES.ADMINISTRATOR,
      ROLE_NAMES.RESPONSIBLE,
    ]);
    expect(reportesRootRoute.redirectTo).toBe('resumen');
    for (const route of [
      resumenReportesRoute,
      ventasReportesRoute,
      vendedoresReportesRoute,
      productosReportesRoute,
      metodosPagoReportesRoute,
      cajasReportesRoute,
    ]) {
      expect(route.canActivate).toContain(roleGuard);
      expect(route.data?.['roles']).toEqual([ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE]);
    }
    expect(administracionRoute.canActivate).toContain(roleGuard);
    expect(administracionRoute.data?.['roles']).toEqual([ROLE_NAMES.ADMINISTRATOR]);
  });

  it('loads distinct components for the POS and sales history routes', async () => {
    const nuevaVentaRoute = findRoute(ventasRoutes, 'nueva');
    const historialVentasRoute = findRoute(ventasRoutes, 'historial');
    if (!nuevaVentaRoute.loadComponent || !historialVentasRoute.loadComponent) {
      throw new Error('Sales routes must lazy load their pages');
    }

    await expect(nuevaVentaRoute.loadComponent()).resolves.not.toBe(
      await historialVentasRoute.loadComponent(),
    );
  });

  it('loads separate pages for my cash and global cash sessions', async () => {
    const miCajaRoute = findRoute(cajaRoutes, 'mi-caja');
    const sesionesRoute = findRoute(cajaRoutes, 'sesiones');
    if (!miCajaRoute.loadComponent || !sesionesRoute.loadComponent) {
      throw new Error('Cash routes must lazy load their pages');
    }

    await expect(miCajaRoute.loadComponent()).resolves.not.toBe(
      await sesionesRoute.loadComponent(),
    );
  });
});
