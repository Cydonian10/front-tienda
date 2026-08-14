import { computed, Injectable, inject, signal } from '@angular/core';

import { TOKEN_KEY } from '../constants';
import { LocalStorageService } from '../services/local-storage.service';
import { AuthUser } from '../models/auth.model';
import { Person } from '../models/people.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly personSignal = signal<Person | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly person = this.personSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  setToken(token: string): void {
    this.localStorageService.set(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  setUser(user: AuthUser): void {
    this.userSignal.set(user);
  }

  setPerson(person: Person): void {
    this.personSignal.set(person);
  }

  logout(): void {
    this.localStorageService.remove(TOKEN_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.personSignal.set(null);
  }
}
