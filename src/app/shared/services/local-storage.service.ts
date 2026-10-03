import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly fallback = new Map<string, string>();

  get<T>(key: string): T | null {
    if (!this.isBrowser) return null;

    let saved = this.fallback.get(key) ?? null;
    if (!this.fallback.has(key)) {
      try {
        saved = this.document.defaultView?.localStorage.getItem(key) ?? null;
      } catch {
        // No persisted value is available while storage is blocked.
      }
    }

    if (saved === null) return null;

    try {
      return JSON.parse(saved) as T;
    } catch {
      this.remove(key);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isBrowser) return;

    const saved = JSON.stringify(value);
    if (saved === undefined) return;

    try {
      this.document.defaultView?.localStorage.setItem(key, saved);
      this.fallback.delete(key);
    } catch {
      // Keep data for this tab when localStorage is blocked or full.
      this.fallback.set(key, saved);
    }
  }

  remove(key: string): void {
    this.fallback.delete(key);
    if (!this.isBrowser) return;

    try {
      this.document.defaultView?.localStorage.removeItem(key);
    } catch {
      // The in-memory copy is already cleared.
    }
  }
}
