import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  beforeEach(() => localStorage.removeItem('front-tienda-auth'));
  afterEach(() => {
    localStorage.removeItem('front-tienda-auth');
    TestBed.resetTestingModule();
  });

  it('persists the session and restores it from localStorage', () => {
    const service = TestBed.inject(AuthSessionService);
    service.set({ accessToken: 'secret', tokenType: 'Bearer', expiresIn: 3600 });

    expect(service.get()?.accessToken).toBe('secret');
    expect(JSON.parse(localStorage.getItem('front-tienda-auth')!).accessToken).toBe('secret');

    TestBed.resetTestingModule();
    expect(TestBed.inject(AuthSessionService).get()?.tokenType).toBe('Bearer');
  });

  it('removes an expired token', () => {
    const service = TestBed.inject(AuthSessionService);
    service.set({ accessToken: 'expired', tokenType: 'Bearer', expiresIn: 0 });

    expect(service.get()).toBeNull();
    expect(localStorage.getItem('front-tienda-auth')).toBeNull();
  });

  it('clears the saved session on logout', () => {
    const service = TestBed.inject(AuthSessionService);
    service.set({ accessToken: 'secret', tokenType: 'Bearer', expiresIn: 60 });
    service.clear();

    expect(service.get()).toBeNull();
    expect(localStorage.getItem('front-tienda-auth')).toBeNull();
  });

  it('rejects invalid persisted data and notices a session removed in another tab', () => {
    localStorage.setItem('front-tienda-auth', '{invalid');
    const service = TestBed.inject(AuthSessionService);
    expect(service.get()).toBeNull();
    expect(localStorage.getItem('front-tienda-auth')).toBeNull();

    service.set({ accessToken: 'secret', tokenType: 'Bearer', expiresIn: 60 });
    localStorage.removeItem('front-tienda-auth');
    expect(service.get()).toBeNull();
  });
});
