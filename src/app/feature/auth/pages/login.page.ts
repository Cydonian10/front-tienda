import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/api/auth.service';
import { PeopleService } from '../../../core/api/people.service';
import { AuthStore } from '../../../core/store/auth.store';

@Component({
  selector: 'login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
})
export default class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly peopleService = inject(PeopleService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['admin@seed.com', [Validators.required, Validators.email]],
    password: ['admin123', [Validators.required]],
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(this.authService.login(this.form.getRawValue()));
      this.authStore.setToken(result.accessToken);
      this.authStore.setUser(result.user);
      const person = await firstValueFrom(this.peopleService.findOne(result.user.personId));
      this.authStore.setPerson(person);
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string | string[] } | null;
      if (Array.isArray(body?.message)) {
        return body.message.join(', ');
      }
      if (body?.message) {
        return body.message;
      }
      return error.message;
    }
    return 'Error inesperado';
  }
}
