import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment.development';

export const ENVIRONMENT = new InjectionToken<typeof environment>('ENVIRONMENT', {
  providedIn: 'root',
  factory: () => environment,
});
