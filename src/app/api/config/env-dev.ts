import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    __FRONT_CONFIG__?: { apiUrl: string };
  }
}

export const ENVIRONMENT = new InjectionToken<typeof environment>('ENVIRONMENT', {
  providedIn: 'root',
  factory: () => typeof window === 'undefined' ? environment : (window.__FRONT_CONFIG__ ?? environment),
});
