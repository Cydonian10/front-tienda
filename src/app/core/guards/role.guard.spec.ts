import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthUser } from '../models/auth.model';
import { OperationalRole, ROLE_NAMES } from '../models/role.model';
import { AuthStore } from '../store/auth.store';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  const authenticated = signal(false);
  const user = signal<AuthUser | null>(null);
  const router = { createUrlTree: vi.fn((commands: string[]) => commands) };

  const createUser = (roles: OperationalRole[]): AuthUser => ({
    id: 1,
    email: 'user@example.com',
    personId: 1,
    roles,
  });

  const activate = (roles?: OperationalRole[]) =>
    TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: roles ? { roles } : {} } as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  beforeEach(() => {
    authenticated.set(false);
    user.set(null);
    router.createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: { isAuthenticated: authenticated, user } },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('redirects an unauthenticated user to login', () => {
    expect(activate([ROLE_NAMES.WORKER])).toEqual(['/auth/login']);
  });

  it('allows a worker only on routes assigned to workers', () => {
    authenticated.set(true);
    user.set(createUser([ROLE_NAMES.WORKER]));

    expect(activate([ROLE_NAMES.WORKER])).toBe(true);
    expect(activate([ROLE_NAMES.RESPONSIBLE])).toEqual(['/inicio']);
    expect(activate([ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE])).toEqual(['/inicio']);
  });

  it('allows a responsible user on shared operational routes but not administrator routes', () => {
    authenticated.set(true);
    user.set(createUser([ROLE_NAMES.RESPONSIBLE]));

    expect(activate([ROLE_NAMES.RESPONSIBLE])).toBe(true);
    expect(activate([ROLE_NAMES.ADMINISTRATOR])).toEqual(['/inicio']);
  });

  it('allows an administrator on administrator routes', () => {
    authenticated.set(true);
    user.set(createUser([ROLE_NAMES.ADMINISTRATOR]));

    expect(activate([ROLE_NAMES.ADMINISTRATOR])).toBe(true);
  });

  it('denies a route with no declared roles', () => {
    authenticated.set(true);
    user.set(createUser([ROLE_NAMES.ADMINISTRATOR]));

    expect(activate()).toEqual(['/inicio']);
  });
});
