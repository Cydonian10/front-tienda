import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { DateTime } from 'luxon';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportsService } from '../../../../core/api/reports.service';
import { PeopleService } from '../../../../core/api/people.service';
import { SalesService } from '../../../../core/api/sales.service';
import { AuthStore } from '../../../../core/store/auth.store';
import { RealtimeService } from '../../../../core/realtime/realtime.service';
import HistorialVentasPage from './historial-ventas.page';

describe('HistorialVentasPage', () => {
  const salesService = { findAll: vi.fn() };
  const reportsService = { findSalesSummary: vi.fn() };
  const peopleService = { findAll: vi.fn() };
  const authStore = {
    person: vi.fn(() => ({ id: 2, firstName: 'Ana', lastName: 'Pérez' })),
    user: vi.fn(() => ({ roles: ['RESPONSABLE'] })),
  };
  const realtimeService = { onEvent: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    realtimeService.onEvent.mockImplementation(() => vi.fn());
    salesService.findAll.mockReturnValue(
      of({ data: [{ id: 999, totalAmount: 1 }], total: 1, page: 1, limit: 20, lastPage: 1 }),
    );
    reportsService.findSalesSummary.mockReturnValue(
      of({
        from: '2026-09-12T00:00:00.000-05:00',
        to: '2026-09-12T23:59:59.999-05:00',
        paidAmount: 150,
        paidCount: 2,
        averageTicket: 75,
        cancelledCount: 1,
        cancelledAmount: 25,
      }),
    );
    peopleService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 100, lastPage: 0 }),
    );
    await TestBed.configureTestingModule({
      imports: [HistorialVentasPage],
      providers: [
        { provide: ReportsService, useValue: reportsService },
        { provide: PeopleService, useValue: peopleService },
        { provide: SalesService, useValue: salesService },
        { provide: AuthStore, useValue: authStore },
        { provide: RealtimeService, useValue: realtimeService },
        { provide: Dialog, useValue: { open: vi.fn() } },
        { provide: Router, useValue: { events: of(), navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } },
      ],
    }).compileComponents();
  });

  it('uses the same Lima range for table rows and server-side summary', async () => {
    const fixture = TestBed.createComponent(HistorialVentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tableFilter = salesService.findAll.mock.calls[0][0];
    expect(tableFilter.startDate).toContain('T00:00:00.000-05:00');
    expect(tableFilter.endDate).toContain('T23:59:59.999-05:00');
    expect(reportsService.findSalesSummary).toHaveBeenCalledWith(
      tableFilter.startDate,
      tableFilter.endDate,
    );
    expect(fixture.nativeElement.textContent).toContain('150');
    expect(fixture.nativeElement.textContent).toContain('75');
  });

  it('updates both sources when selecting a period preset', async () => {
    const fixture = TestBed.createComponent(HistorialVentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.componentInstance as any;

    page.setPeriod('month');
    await fixture.whenStable();

    const lastTableCall = salesService.findAll.mock.calls.at(-1);
    expect(lastTableCall).toBeDefined();
    const tableFilter = lastTableCall![0];
    expect(tableFilter.startDate).toMatch(/T00:00:00\.000-05:00$/);
    expect(tableFilter.endDate).toMatch(/T23:59:59\.999-05:00$/);
    expect(reportsService.findSalesSummary).toHaveBeenLastCalledWith(
      tableFilter.startDate,
      tableFilter.endDate,
    );
  });

  it('does not select a future day or request either source', async () => {
    const fixture = TestBed.createComponent(HistorialVentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.componentInstance as any;
    const tomorrow = DateTime.now().setZone('America/Lima').plus({ days: 1 }).toISODate();
    page.filters.set({ status: '', sellerId: '', startDate: tomorrow, endDate: tomorrow });
    page.periodPreset.set('today');
    const tableCalls = salesService.findAll.mock.calls.length;
    const summaryCalls = reportsService.findSalesSummary.mock.calls.length;

    page.nextDay();

    expect(salesService.findAll).toHaveBeenCalledTimes(tableCalls);
    expect(reportsService.findSalesSummary).toHaveBeenCalledTimes(summaryCalls);
  });

  it('keeps table and summary failures independent and retries each source', async () => {
    salesService.findAll.mockReturnValue(throwError(() => new Error('No se pudo cargar la tabla')));
    reportsService.findSalesSummary.mockReturnValue(
      of({
        from: '2026-09-12T00:00:00.000-05:00',
        to: '2026-09-12T23:59:59.999-05:00',
        paidAmount: 0,
        paidCount: 0,
        averageTicket: 0,
        cancelledCount: 0,
        cancelledAmount: 0,
      }),
    );
    const fixture = TestBed.createComponent(HistorialVentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.componentInstance as any;

    expect(fixture.nativeElement.textContent).toContain('Reintentar tabla');
    expect(fixture.nativeElement.textContent).toContain('No hay ventas cobradas ni canceladas');
    const callsBeforeRetry = salesService.findAll.mock.calls.length;
    salesService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 20, lastPage: 0 }),
    );

    page.retryTable();
    await fixture.whenStable();

    expect(salesService.findAll).toHaveBeenCalledTimes(callsBeforeRetry + 1);
  });

  it('refreshes the table and summary from HTTP after a paid sale event', async () => {
    const listener = vi.fn();
    realtimeService.onEvent.mockImplementation((callback: typeof listener) => {
      listener.mockImplementation(callback);
      return vi.fn();
    });
    const fixture = TestBed.createComponent(HistorialVentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const salesCalls = salesService.findAll.mock.calls.length;
    const summaryCalls = reportsService.findSalesSummary.mock.calls.length;

    listener({ name: 'sale.paid', occurredAt: '', entityId: 1 });
    await fixture.whenStable();

    expect(salesService.findAll).toHaveBeenCalledTimes(salesCalls + 1);
    expect(reportsService.findSalesSummary).toHaveBeenCalledTimes(summaryCalls + 1);
  });
});
