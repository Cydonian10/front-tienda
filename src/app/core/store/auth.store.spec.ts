import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TOKEN_KEY } from '../constants';
import { RealtimeService } from '../realtime/realtime.service';
import { LocalStorageService } from '../services/local-storage.service';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  const localStorageService = {
    set: vi.fn(),
    remove: vi.fn(),
  };
  const realtimeService = { disconnect: vi.fn() };

  beforeEach(() => {
    localStorageService.set.mockClear();
    localStorageService.remove.mockClear();
    realtimeService.disconnect.mockClear();
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: RealtimeService, useValue: realtimeService },
      ],
    });
  });

  it('disconnects realtime before clearing the persisted session', () => {
    const store = TestBed.inject(AuthStore);

    store.logout();

    expect(realtimeService.disconnect).toHaveBeenCalledOnce();
    expect(localStorageService.remove).toHaveBeenCalledWith(TOKEN_KEY);
    expect(store.isAuthenticated()).toBe(false);
  });
});
