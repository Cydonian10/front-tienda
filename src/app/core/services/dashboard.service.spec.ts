import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthUser } from '../models/auth.model';
import { ROLE_NAMES } from '../models/role.model';
import { AuthStore } from '../store/auth.store';
import { DashboardService, selectDashboardRole } from './dashboard.service';

describe('DashboardService', () => {
  const user = signal<AuthUser | null>(null);
  let service: DashboardService;

  beforeEach(() => {
    user.set(null);
    TestBed.configureTestingModule({
      providers: [DashboardService, { provide: AuthStore, useValue: { user } }],
    });
    service = TestBed.inject(DashboardService);
  });

  it('shows only worker routes and filters nested entries', () => {
    user.set({
      id: 1,
      email: 'worker@example.com',
      personId: 1,
      roles: [ROLE_NAMES.WORKER],
    });

    const menu = service.menu();

    expect(menu.map((item) => item.id)).toEqual(['inicio', 'ventas', 'caja']);
    expect(menu.find((item) => item.id === 'ventas')?.children?.map((item) => item.id)).toEqual([
      'nueva-venta',
    ]);
    expect(menu.find((item) => item.id === 'caja')?.children?.map((item) => item.id)).toEqual([
      'mi-caja',
    ]);
  });

  it('updates the visible menu without leaking prior user entries', () => {
    user.set({
      id: 1,
      email: 'admin@example.com',
      personId: 1,
      roles: [ROLE_NAMES.ADMINISTRATOR],
    });
    expect(service.menu().map((item) => item.id)).toEqual([
      'inicio',
      'ventas',
      'caja',
      'reportes',
      'mantenimiento',
      'administracion',
    ]);

    user.set({
      id: 2,
      email: 'responsible@example.com',
      personId: 2,
      roles: [ROLE_NAMES.RESPONSIBLE],
    });
    const menu = service.menu();

    expect(menu.map((item) => item.id)).toEqual(['inicio', 'ventas', 'caja', 'reportes']);
    expect(menu.find((item) => item.id === 'ventas')?.children?.map((item) => item.id)).toEqual([
      'nueva-venta',
      'historial-ventas',
    ]);
  });

  it('selects the highest dashboard privilege deterministically', () => {
    expect(selectDashboardRole([ROLE_NAMES.WORKER])).toBe(ROLE_NAMES.WORKER);
    expect(selectDashboardRole([ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER])).toBe(
      ROLE_NAMES.RESPONSIBLE,
    );
    expect(
      selectDashboardRole([
        ROLE_NAMES.WORKER,
        ROLE_NAMES.RESPONSIBLE,
        ROLE_NAMES.ADMINISTRATOR,
      ]),
    ).toBe(ROLE_NAMES.ADMINISTRATOR);
  });
});
