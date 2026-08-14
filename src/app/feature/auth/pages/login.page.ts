import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthStore } from '../../../core/store/auth.store';

@Component({
  selector: 'login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
})
export default class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly store = this.authStore;

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    const ok = await this.authStore.login(this.form.getRawValue());
    if (ok) {
      await this.router.navigate(['/dashboard']);
    }
  }
}
