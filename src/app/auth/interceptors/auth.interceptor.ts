import { DOCUMENT } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ENVIRONMENT } from '../../api/config/env-dev';
import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const { apiUrl } = inject(ENVIRONMENT);
  const sessionService = inject(AuthSessionService);
  const document = inject(DOCUMENT);
  if (!apiUrl || request.headers.has('Authorization')) return next(request);

  const api = new URL(apiUrl, document.baseURI);
  const url = new URL(request.url, document.baseURI);
  const apiPath = api.pathname.replace(/\/$/, '');
  if (
    url.origin !== api.origin ||
    !url.pathname.startsWith(`${apiPath}/`) ||
    url.pathname === `${apiPath}/auth/login`
  ) {
    return next(request);
  }

  const session = sessionService.get();
  if (!session) return next(request);

  return next(
    request.clone({ setHeaders: { Authorization: `${session.tokenType} ${session.accessToken}` } }),
  );
};
