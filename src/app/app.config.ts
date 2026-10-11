import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { withDevtools } from '@tanstack/angular-query-experimental/devtools';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { apiErrorInterceptor } from './shared/interceptors/api-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
    provideTanStackQuery(new QueryClient(), withDevtools()),
  ],
};
