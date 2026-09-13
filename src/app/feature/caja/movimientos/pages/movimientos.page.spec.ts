import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CashMovementsService } from '../../../../core/api/cash-movements.service';
import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { PeopleService } from '../../../../core/api/people.service';
import MovimientosPage from './movimientos.page';

describe('MovimientosPage', () => {
  const movementsService = { findAll: vi.fn() };
  const registersService = { findAll: vi.fn() };
  const peopleService = { findAll: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    movementsService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 20, lastPage: 0 }),
    );
    registersService.findAll.mockReturnValue(of([]));
    peopleService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 100, lastPage: 0 }),
    );
    await TestBed.configureTestingModule({
      imports: [MovimientosPage],
      providers: [
        { provide: CashMovementsService, useValue: movementsService },
        { provide: CashRegistersService, useValue: registersService },
        { provide: PeopleService, useValue: peopleService },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } },
        { provide: Router, useValue: { events: of() } },
      ],
    }).compileComponents();
  });

  it('sends every audit filter when applying the movement query', async () => {
    const fixture = TestBed.createComponent(MovimientosPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.componentInstance as any;

    page.filters.set({
      cashRegisterId: '4',
      type: 'expense',
      createdById: '7',
      startDate: '2026-09-01',
      endDate: '2026-09-13',
    });
    page.applyFilters();
    await fixture.whenStable();

    expect(movementsService.findAll).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      cashRegisterId: 4,
      type: 'expense',
      createdById: 7,
      startDate: '2026-09-01',
      endDate: '2026-09-13',
    });
  });
});
