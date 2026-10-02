import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';

export type AppTheme = 'ferreteria' | 'light';

const STORAGE_KEY = 'front-tienda-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<AppTheme>('ferreteria');

  readonly theme = this.current.asReadonly();
  readonly isLight = computed(() => this.theme() === 'light');

  constructor() {
    // Restore only after browser rendering so SSR and hydration share the initial state.
    afterNextRender(() => {
      let theme: AppTheme = 'ferreteria';
      try {
        const saved = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'ferreteria') theme = saved;
      } catch {
        // Storage can be blocked by the browser; switching still works for this session.
      }
      this.apply(theme);
    });
  }

  toggle(): void {
    this.setTheme(this.isLight() ? 'ferreteria' : 'light');
  }

  setTheme(theme: AppTheme): void {
    if (!this.isBrowser) return;
    this.apply(theme);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Persistence is optional; never block the UI when storage is unavailable.
    }
  }

  private apply(theme: AppTheme): void {
    this.current.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
