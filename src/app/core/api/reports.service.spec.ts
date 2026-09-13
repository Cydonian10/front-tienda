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
      service.findSalesSummary(
        '2026-09-12T00:00:00.000-05:00',
        '2026-09-12T23:59:59.999-05:00',
      ),
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
});
