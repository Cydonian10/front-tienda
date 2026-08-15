import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { AuthService } from './core/api/auth.service';
import { AuthStore } from './core/store/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const authStore = inject(AuthStore);
      const restore = authService.restoreSession();
      const minTime = new Promise((resolve) => setTimeout(resolve, 200));
      try {
        const session = await restore;
        if (session) {
          authStore.setToken(session.accessToken);
          authStore.setUser(session.user);
          authStore.setPerson(session.person);
        } else {
          authStore.logout();
        }
      } finally {
        await minTime;
      }
    }),
  ],
};
