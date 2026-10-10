import { Injectable, inject } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthApi } from '../../api/access-control/auth-api';
import { AuthStore } from '../../store/auth/auth.store';
import { authPerfilQueryKey, authPerfilQueryOptions } from '../actions/auth-perfil.action';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthProfileService {
  private readonly authApi = inject(AuthApi);
  private readonly session = inject(AuthSessionService);
  private readonly store = inject(AuthStore);
  private readonly queryClient = inject(QueryClient);
  private lastRequestedToken: string | null = null;

  async load(revalidate = false): Promise<void> {
    const accessToken = this.session.get()?.accessToken;
    if (!accessToken) throw new Error('No hay una sesión activa');

    if (this.lastRequestedToken && this.lastRequestedToken !== accessToken) this.clear();
    this.lastRequestedToken = accessToken;

    const options = authPerfilQueryOptions(this.authApi);
    const perfil = await this.queryClient.query({
      ...options,
      staleTime: revalidate ? 0 : options.staleTime,
    });
    // Do not restore a profile if the account changed while the request was in flight.
    if (this.session.get()?.accessToken !== accessToken) {
      throw new Error('La sesión cambió durante la carga del perfil');
    }
    this.store.setProfile(perfil);
  }

  clear(): void {
    this.lastRequestedToken = null;
    this.store.clear();
    this.queryClient.removeQueries({ queryKey: authPerfilQueryKey });
  }
}
