import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  get<T>(key: string): T | null {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  set<T>(key: string, value: T): void {
    const stored = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stored);
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
