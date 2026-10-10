import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthProfileService } from './auth-profile.service';
import { AuthSessionService } from './auth-session.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog/confirm-dialog.service';

@Injectable({ providedIn: 'root' })
export class AuthLogoutService {
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);
  private readonly profile = inject(AuthProfileService);
  private readonly queryClient = inject(QueryClient);
  private readonly confirmation = inject(ConfirmDialogService);

  requestLogout(): void {
    this.confirmation
      .confirm({
        title: '¿Cerrar sesión?',
        message: 'Tendrás que iniciar sesión nuevamente para volver a ingresar.',
        confirmText: 'Cerrar sesión',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.session.clear();
        this.profile.clear();
        this.queryClient.clear();
        void this.router.navigate(['/auth/login']);
      });
  }
}
