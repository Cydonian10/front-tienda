import { DOCUMENT } from '@angular/common';
import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ENVIRONMENT } from '../../api/config/env-dev';
import { ToastService } from '../services/toast/toast.service';

/** Para peticiones cuyo error ya se muestra en el formulario o en la página. */
export const SKIP_API_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

function apiMessage(error: HttpErrorResponse): string {
  if (error.status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexión.';

  // No mostrar detalles internos del servidor ni mensajes técnicos del navegador.
  if (error.status >= 500) return 'El servidor no pudo completar la solicitud. Intenta más tarde.';

  const body = error.error;
  if (body && typeof body === 'object') {
    const message = body.message;
    if (typeof message === 'string' && message.trim()) return message.trim();
    if (Array.isArray(message)) {
      const messages = message.filter(
        (value): value is string => typeof value === 'string' && !!value.trim(),
      );
      if (messages.length) return messages.join('. ');
    }
  }

  switch (error.status) {
    case 400:
    case 422:
      return 'Revisa los datos e intenta nuevamente.';
    case 401:
      return 'Tu sesión no es válida. Vuelve a iniciar sesión.';
    case 403:
      return 'No tienes los permisos requeridos.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 409:
      return 'La operación entra en conflicto con los datos actuales.';
    case 429:
      return 'Hay demasiadas solicitudes. Intenta de nuevo más tarde.';
    default:
      return 'No se pudo completar la operación. Intenta nuevamente.';
  }
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const { apiUrl } = inject(ENVIRONMENT);
  const document = inject(DOCUMENT);
  const toast = inject(ToastService);

  if (!apiUrl || request.context.get(SKIP_API_ERROR_TOAST)) return next(request);

  const api = new URL(apiUrl, document.baseURI);
  const url = new URL(request.url, document.baseURI);
  const apiPath = api.pathname.replace(/\/$/, '');
  // El formulario de login ya tiene su propio mensaje. No interceptar servicios externos.
  if (
    url.origin !== api.origin ||
    !url.pathname.startsWith(`${apiPath}/`) ||
    url.pathname === `${apiPath}/auth/login`
  ) {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        (request.method !== 'GET' || error.status === 403)
      ) {
        toast.error(apiMessage(error));
      }
      // La mutación o la consulta conserva el error para manejar su estado local.
      return throwError(() => error);
    }),
  );
};
