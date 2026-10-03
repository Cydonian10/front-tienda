import { Component, inject, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { ReactiveFormsModule } from '@angular/forms';
import { form, FormField, submit } from '@angular/forms/signals';
import { authLoginAction } from '../../actions/auth-login.action';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  imports: [Icon, ThemeToggle, ReactiveFormsModule, FormField],
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  host: { class: 'block' },
})
export default class LoginPage {
  readonly passwordVisible = signal(false);
  readonly authLoginAction = authLoginAction;
  readonly toasService = inject(ToastService);

  readonly loginModel = signal({
    email: '',
    password: '',
  });

  loginForm = form(this.loginModel);

  async loginSubmit() {
    const success = await submit(this.loginForm, async (form) => {
      const data = form().value();
      await this.authLoginAction().mutateAsync(data);
    });

    if (success) {
      this.toasService.success('Login existoso');
    }
  }
}
