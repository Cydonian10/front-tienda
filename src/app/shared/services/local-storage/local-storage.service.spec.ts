import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  const key = 'front-tienda-test-storage';

  beforeEach(() => localStorage.removeItem(key));
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem(key);
    TestBed.resetTestingModule();
  });

  it('stores JSON and restores values after the service is recreated', () => {
    const storage = TestBed.inject(LocalStorageService);
    storage.set(key, { count: 2 });

    expect(localStorage.getItem(key)).toBe('{"count":2}');
    TestBed.resetTestingModule();
    expect(TestBed.inject(LocalStorageService).get<{ count: number }>(key)).toEqual({ count: 2 });
  });

  it('removes malformed JSON rather than returning it', () => {
    localStorage.setItem(key, '{invalid');
    expect(TestBed.inject(LocalStorageService).get(key)).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('notices changes made in another tab', () => {
    const storage = TestBed.inject(LocalStorageService);
    storage.set(key, 'saved');
    localStorage.removeItem(key);
    expect(storage.get(key)).toBeNull();
  });

  it('uses memory when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Blocked');
    });

    const storage = TestBed.inject(LocalStorageService);
    storage.set(key, [1, 2]);
    expect(storage.get<number[]>(key)).toEqual([1, 2]);
    storage.remove(key);
    expect(storage.get(key)).toBeNull();
  });

  it('uses memory if writes fail but reads remain available', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const storage = TestBed.inject(LocalStorageService);
    storage.set(key, 'temporary');
    expect(storage.get<string>(key)).toBe('temporary');
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('does not access localStorage during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const storage = TestBed.inject(LocalStorageService);
    storage.set(key, 'server value');
    expect(storage.get(key)).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });
});
