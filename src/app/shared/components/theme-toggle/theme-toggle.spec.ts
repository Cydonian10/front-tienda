import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeToggle } from './theme-toggle';
import { ThemeService } from '../../services/theme.service';

describe('ThemeToggle', () => {
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

  it('switches the document theme and persists the preference', () => {
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Cambiar a tema claro');
    button.click();
    fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('front-tienda-theme')).toBe('light');
    expect(button.getAttribute('aria-label')).toBe('Cambiar a tema oscuro');
    button.click();
    fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('ferreteria');
    expect(localStorage.getItem('front-tienda-theme')).toBe('ferreteria');
  });

  it('restores a saved light theme after browser rendering', () => {
    localStorage.setItem('front-tienda-theme', 'light');
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    expect(fixture.componentInstance.theme.isLight()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('ignores unknown saved themes', () => {
    localStorage.setItem('front-tienda-theme', 'unknown');
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    expect(fixture.componentInstance.theme.theme()).toBe('ferreteria');
    expect(document.documentElement.dataset['theme']).toBe('ferreteria');
  });

  it('works when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Blocked');
    });
    const fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
    expect(() => fixture.componentInstance.theme.toggle()).not.toThrow();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('does not change the document during SSR', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const theme = TestBed.inject(ThemeService);
    theme.toggle();
    expect(theme.theme()).toBe('ferreteria');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
