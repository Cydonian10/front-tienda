import { Injectable, signal } from '@angular/core';
import { AuthPerfil } from '../../api/interfaces/access-control/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly currentPerfil = signal<AuthPerfil | null>(null);
  readonly authPerfil = this.currentPerfil.asReadonly();

  setProfile(perfil: AuthPerfil): void {
    this.currentPerfil.set(perfil);
  }

  clear(): void {
    this.currentPerfil.set(null);
  }
}
