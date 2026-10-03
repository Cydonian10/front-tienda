import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { Icon } from '../../../shared/components/icon/icon';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { authLoginAction } from '../../actions/auth-login.action';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { FieldErrors } from '../../../shared/components/field-errors/field-errors';

@Component({
  imports: [Icon, ThemeToggle, ReactiveFormsModule, FormField, FieldErrors],
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  host: { class: 'block' },
})
export default class LoginPage {
  readonly passwordVisible = signal(false);
  readonly authLoginAction = authLoginAction();
  readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginModel = signal({
    email: 'admin@example.com',
    password: 'cambiar-antes-de-usar-123',
  });

  loginForm = form(this.loginModel, (path) => {
    required(path.email, {
      message: 'El email es obligatorio',
    });

    email(path.email, {
      message: 'Ingrese un email valido',
    });

    required(path.password, {
      message: 'El password es obligatorio',
    });

    minLength(path.password, 6, {
      message: 'La contraseña debe tener mínimo 6 caracteres',
    });
  });

  async loginSubmit() {
    try {
      const success = await submit(this.loginForm, async (form) => {
        await this.authLoginAction.mutateAsync(form().value());
      });

      if (success) {
        this.toastService.success('Inicio de sesión exitoso');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        await this.router.navigateByUrl(
          returnUrl?.startsWith('/admin/') || returnUrl === '/admin' ? returnUrl : '/admin',
        );
      }
    } catch {
      this.toastService.error('No se pudo iniciar sesión. Verifica tus credenciales.');
    }
  }
}
