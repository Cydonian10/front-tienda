import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('front-tienda-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    localStorage.removeItem('front-tienda-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets and persists the selected theme', () => {
    const theme = TestBed.inject(ThemeService);

    theme.setTheme('light');
    expect(theme.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('front-tienda-theme')).toBe('light');

    theme.toggle();
    expect(theme.theme()).toBe('ferreteria');
    expect(localStorage.getItem('front-tienda-theme')).toBe('ferreteria');
  });

  it('does not access browser state during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const theme = TestBed.inject(ThemeService);

    theme.setTheme('light');
    expect(theme.theme()).toBe('ferreteria');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('front-tienda-theme')).toBeNull();
  });
});
