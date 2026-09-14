import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CashMovementsService } from '../../../core/api/cash-movements.service';
import { CashRegistersService } from '../../../core/api/cash-registers.service';
import { ReportsService } from '../../../core/api/reports.service';
import { SalesService } from '../../../core/api/sales.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ROLE_NAMES } from '../../../core/models/role.model';
import { AuthStore } from '../../../core/store/auth.store';
import InicioPage from './inicio.page';

describe('InicioPage', () => {
  const dashboardRole = signal<
    typeof ROLE_NAMES.ADMINISTRATOR | typeof ROLE_NAMES.RESPONSIBLE | typeof ROLE_NAMES.WORKER
  >(ROLE_NAMES.WORKER);
  const cashRegistersService = { findAll: vi.fn() };
  const cashMovementsService = { findAll: vi.fn() };
  const reportsService = { findSalesSummary: vi.fn(), findOverview: vi.fn() };
  const salesService = { findAll: vi.fn() };
  const authStore = {
    person: vi.fn(() => ({ id: 2, firstName: 'Ana', lastName: 'Pérez' })),
  };
  const dashboardService = {
    dashboardRole,
    authorizedRoutes: vi.fn(() => [
      { id: 'historial-ventas', label: 'Historial', route: '/ventas/historial' },
      { id: 'sesiones-caja', label: 'Sesiones', route: '/caja/sesiones' },
      { id: 'movimientos-caja', label: 'Movimientos', route: '/caja/movimientos' },
      { id: 'reportes', label: 'Reportes', route: '/reportes' },
    ]),
  };

  const emptySummary = {
    from: '2026-09-08T00:00:00.000-05:00',
    to: '2026-09-14T23:59:59.999-05:00',
    paidAmount: 0,
    paidCount: 0,
    averageTicket: 0,
    cancelledCount: 0,
    cancelledAmount: 0,
  };
  const emptyOverview = {
    paidAmount: 0,
    paidCount: 0,
    averageTicket: 0,
    cancelledAmount: 0,
    cancelledCount: 0,
    topSeller: null,
    topProduct: null,
    paymentMethods: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    dashboardRole.set(ROLE_NAMES.WORKER);
    cashRegistersService.findAll.mockReturnValue(of([]));
    cashMovementsService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 5, lastPage: 0 }),
    );
    salesService.findAll.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 5, lastPage: 0 }));
    reportsService.findSalesSummary.mockReturnValue(of(emptySummary));
    reportsService.findOverview.mockReturnValue(of(emptyOverview));

    await TestBed.configureTestingModule({
      imports: [InicioPage],
      providers: [
        { provide: CashMovementsService, useValue: cashMovementsService },
        { provide: CashRegistersService, useValue: cashRegistersService },
        { provide: ReportsService, useValue: reportsService },
        { provide: SalesService, useValue: salesService },
        { provide: DashboardService, useValue: dashboardService },
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: { events: of() } },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } },
      ],
    }).compileComponents();
  });

  it('shows the worker dashboard with a visible Mi caja link when no own session exists', async () => {
    const fixture = TestBed.createComponent(InicioPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await (fixture.componentInstance as any).retrySessions();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ir a Mi caja');
    expect(salesService.findAll).toHaveBeenCalledWith({ page: 1, limit: 5 });
    expect(cashMovementsService.findAll).not.toHaveBeenCalled();
  });

  it.each([ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.ADMINISTRATOR])(
    'shows the management dashboard for %s',
    async (role) => {
      dashboardRole.set(role);
      const fixture = TestBed.createComponent(InicioPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Indicadores de caja y ventas');
      expect(reportsService.findSalesSummary).toHaveBeenCalledOnce();
      expect(reportsService.findOverview).toHaveBeenCalledOnce();
      expect(dashboardService.authorizedRoutes).toHaveBeenCalled();
    },
  );

  it('shows empty-week states without calculating financial totals in the page', async () => {
    dashboardRole.set(ROLE_NAMES.RESPONSIBLE);
    const fixture = TestBed.createComponent(InicioPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay ventas cobradas ni canceladas en esta semana.');
    expect(fixture.nativeElement.textContent).toContain('Sin actividad comercial durante esta semana.');
  });

  it('keeps a successful overview visible when the weekly summary fails and retries only it', async () => {
    dashboardRole.set(ROLE_NAMES.RESPONSIBLE);
    reportsService.findSalesSummary.mockReturnValue(throwError(() => new Error('Resumen no disponible')));
    reportsService.findOverview.mockReturnValue(
      of({
        ...emptyOverview,
        paidAmount: 120,
        paidCount: 2,
        topSeller: { sellerId: 3, sellerName: 'Luis Flores', paidAmount: 120 },
      }),
    );
    const fixture = TestBed.createComponent(InicioPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.componentInstance as any;

    expect(fixture.nativeElement.textContent).toContain('Reintentar indicadores');
    expect(fixture.nativeElement.textContent).toContain('Luis Flores');
    expect(reportsService.findOverview).toHaveBeenCalledOnce();
    reportsService.findSalesSummary.mockReturnValue(of(emptySummary));

    page.retrySummary();
    await fixture.whenStable();

    expect(reportsService.findSalesSummary).toHaveBeenCalledTimes(2);
    expect(reportsService.findOverview).toHaveBeenCalledOnce();
  });
});
