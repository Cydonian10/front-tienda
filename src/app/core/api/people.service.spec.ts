import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { PeopleService } from './people.service';

describe('PeopleService', () => {
  let service: PeopleService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PeopleService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PeopleService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('loads eligible cash responsibles', async () => {
    const request = firstValueFrom(service.findCashResponsibles());
    const httpRequest = httpTesting.expectOne(
      `${environment.apiUrl}/people/cash-responsibles`,
    );

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({
      data: [{ id: 1, firstName: 'Ana', lastName: 'Pérez' }],
      message: 'OK',
    });

    await expect(request).resolves.toEqual([
      { id: 1, firstName: 'Ana', lastName: 'Pérez' },
    ]);
  });
});
