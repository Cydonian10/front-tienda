import { HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TOKEN_KEY } from '../constants';
import { AuthService } from '../api/auth.service';
import { PeopleService } from '../api/people.service';
import { LocalStorageService } from '../services/local-storage.service';
import { AuthUser, LoginRequest } from '../models/auth.model';
import { Person } from '../models/people.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);
  private readonly peopleService = inject(PeopleService);
  private readonly localStorageService = inject(LocalStorageService);

  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly personSignal = signal<Person | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly person = this.personSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  async init(): Promise<void> {
    const token = this.localStorageService.get<string>(TOKEN_KEY);
    if (!token) {
      return;
    }
    this.tokenSignal.set(token);
    try {
      const me = await firstValueFrom(this.authService.me());
      const person = await firstValueFrom(
        this.peopleService.findOne(me.personId),
      );
      this.userSignal.set({
        id: me.sub,
        email: me.email,
        personId: me.personId,
        roles: me.roles,
      });
      this.personSignal.set(person);
    } catch {
      this.logout();
    }
  }

  async login(dto: LoginRequest): Promise<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const result = await firstValueFrom(this.authService.login(dto));
      this.localStorageService.set(TOKEN_KEY, result.accessToken);
      this.tokenSignal.set(result.accessToken);
      this.userSignal.set(result.user);
      const person = await firstValueFrom(
        this.peopleService.findOne(result.user.personId),
      );
      this.personSignal.set(person);
      return true;
    } catch (error) {
      this.errorSignal.set(this.getErrorMessage(error));
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  logout(): void {
    this.localStorageService.remove(TOKEN_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.personSignal.set(null);
    this.errorSignal.set(null);
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
