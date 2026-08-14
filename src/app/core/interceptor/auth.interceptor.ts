import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TOKEN_KEY } from '../constants';
import { LocalStorageService } from '../services/local-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const localStorageService = inject(LocalStorageService);
  const token = localStorageService.get<string>(TOKEN_KEY);
  if (token) {
    const authorized = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authorized);
  }
  return next(req);
};
