import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CashRegisterOpeningsService } from '../../../../core/api/cash-register-openings.service';
import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { PeopleService } from '../../../../core/api/people.service';
import { AuthStore } from '../../../../core/store/auth.store';
import CajasPage from './cajas.page';

describe('CajasPage', () => {
  const register = { id: 1, code: 'CAJA-01', name: 'Principal', active: true, openOpening: null };
  const registersService = { findAll: vi.fn() }; const openingsService = { findAll: vi.fn() };
  beforeEach(async () => { vi.clearAllMocks(); registersService.findAll.mockReturnValue(of([register])); openingsService.findAll.mockReturnValue(of([])); await TestBed.configureTestingModule({ imports: [CajasPage], providers: [{ provide: CashRegistersService, useValue: registersService }, { provide: CashRegisterOpeningsService, useValue: openingsService }, { provide: PeopleService, useValue: { findCashResponsibles: vi.fn() } }, { provide: Dialog, useValue: { open: vi.fn() } }, { provide: AuthStore, useValue: { user: signal({ roles: ['TRABAJADOR'] }), person: signal(null) } }, { provide: Router, useValue: { events: of() } }, { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } }] }).compileComponents(); });

  it('loads the selected cash register history for the current local month', async () => {
    const fixture = TestBed.createComponent(CajasPage); fixture.detectChanges(); await fixture.whenStable();
    const page = fixture.componentInstance as any;
    expect(openingsService.findAll).toHaveBeenCalledWith({ cashRegisterId: 1, year: page.currentYear(), month: page.currentMonth() });
  });

  it('moves history across year boundaries', async () => {
    const fixture = TestBed.createComponent(CajasPage); fixture.detectChanges(); await fixture.whenStable(); const page = fixture.componentInstance as any;
    page.currentYear.set(2026); page.currentMonth.set(1); page.changeMonth(-1); await fixture.whenStable();
    expect(page.currentYear()).toBe(2025); expect(page.currentMonth()).toBe(12);
    expect(openingsService.findAll).toHaveBeenLastCalledWith({ cashRegisterId: 1, year: 2025, month: 12 });
  });
});
