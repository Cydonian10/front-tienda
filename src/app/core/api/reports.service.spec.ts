import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('requests the sales summary range and unwraps the response', async () => {
    const request = firstValueFrom(
      service.findSalesSummary('2026-09-12T00:00:00.000-05:00', '2026-09-12T23:59:59.999-05:00'),
    );
    const httpRequest = httpTesting.expectOne(
      (request) =>
        request.url === `${environment.apiUrl}/reports/sales-summary` &&
        request.params.get('from') === '2026-09-12T00:00:00.000-05:00' &&
        request.params.get('to') === '2026-09-12T23:59:59.999-05:00',
    );

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({
      data: {
        from: '2026-09-12T00:00:00.000-05:00',
        to: '2026-09-12T23:59:59.999-05:00',
        paidAmount: 150,
        paidCount: 2,
        averageTicket: 75,
        cancelledCount: 1,
        cancelledAmount: 25,
      },
      message: 'OK',
    });

    await expect(request).resolves.toMatchObject({
      paidAmount: 150,
      averageTicket: 75,
      cancelledAmount: 25,
    });
  });

  it('requests and unwraps overview, daily sales and seller reports', async () => {
    const range = {
      from: '2026-09-12T00:00:00.000-05:00',
      to: '2026-09-12T23:59:59.999-05:00',
    };
    const overview = firstValueFrom(service.findOverview(range));
    const dailySales = firstValueFrom(service.findSalesByDay(range));
    const sellers = firstValueFrom(service.findSellers(range));

    httpTesting
      .expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/reports/overview` &&
          request.params.get('from') === range.from &&
          request.params.get('to') === range.to,
      )
      .flush({
        data: {
          paidAmount: 150,
          paidCount: 2,
          averageTicket: 75,
          cancelledAmount: 0,
          cancelledCount: 0,
          topSeller: null,
          topProduct: null,
          paymentMethods: [],
        },
        message: 'OK',
      });
    httpTesting
      .expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/reports/sales-by-day` &&
          request.params.get('from') === range.from &&
          request.params.get('to') === range.to,
      )
      .flush({
        data: [
          {
            date: '2026-09-12',
            paidAmount: 150,
            paidCount: 2,
            cancelledAmount: 0,
            cancelledCount: 0,
          },
        ],
        message: 'OK',
      });
    httpTesting
      .expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/reports/sellers` &&
          request.params.get('from') === range.from &&
          request.params.get('to') === range.to,
      )
      .flush({
        data: [
          {
            sellerId: 1,
            sellerName: 'Ana Pérez',
            paidAmount: 150,
            paidCount: 2,
            averageTicket: 75,
            cancelledAmount: 0,
            cancelledCount: 0,
          },
        ],
        message: 'OK',
      });

    await expect(overview).resolves.toMatchObject({ paidAmount: 150 });
    await expect(dailySales).resolves.toHaveLength(1);
    await expect(sellers).resolves.toHaveLength(1);
  });

  it('requests and unwraps product, payment and cash reports', async () => {
    const range = {
      from: '2026-09-12T00:00:00.000-05:00',
      to: '2026-09-12T23:59:59.999-05:00',
    };
    const products = firstValueFrom(service.findProducts(range));
    const paymentMethods = firstValueFrom(service.findPaymentMethods(range));
    const cashRegisters = firstValueFrom(service.findCashRegisters(range));

    httpTesting
      .expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/reports/products` &&
          request.params.get('from') === range.from &&
          request.params.get('to') === range.to,
      )
      .flush({
        data: [
          { productId: 1, productName: 'Arroz', quantityBase: 12, paidAmount: 60, paidCount: 1 },
        ],
        message: 'OK',
      });
    httpTesting
      .expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/reports/payment-methods` &&
          request.params.get('from') === range.from &&
          request.params.get('to') === range.to,
      )
      .flush({
        data: [
          { paymentMethodId: 1, name: 'Efectivo', paidAmount: 60, paidCount: 1, percentage: 100 },
        ],
        message: 'OK',
      });
    httpTesting
      .expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/reports/cash-registers` &&
          request.params.get('from') === range.from &&
          request.params.get('to') === range.to,
      )
      .flush({ data: { closedSessions: [], openSessions: [] }, message: 'OK' });

    await expect(products).resolves.toHaveLength(1);
    await expect(paymentMethods).resolves.toMatchObject([{ percentage: 100 }]);
    await expect(cashRegisters).resolves.toEqual({ closedSessions: [], openSessions: [] });
  });
});
