import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { PeopleService } from './people.service';
import { LocalStorageService } from '../services/local-storage.service';
import { TOKEN_KEY } from '../constants';
import {
  JwtUser,
  LoginRequest,
  LoginResponse,
  RestoredSession,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService extends ApiService {
  private readonly peopleService = inject(PeopleService);
  private readonly localStorageService = inject(LocalStorageService);

  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.unwrap(
      this.http.post<ApiResponse<LoginResponse>>(
        `${this.apiUrl}/auth/login`,
        dto,
      ),
    );
  }

  me(): Observable<JwtUser> {
    return this.unwrap(
      this.http.get<ApiResponse<JwtUser>>(`${this.apiUrl}/auth/me`),
    );
  }

  async restoreSession(): Promise<RestoredSession | null> {
    const token = this.localStorageService.get<string>(TOKEN_KEY);
    if (!token) {
      return null;
    }
    try {
      const me = await firstValueFrom(this.me());
      const person = await firstValueFrom(
        this.peopleService.findOne(me.personId),
      );
      return {
        accessToken: token,
        user: {
          id: me.sub,
          email: me.email,
          personId: me.personId,
          roles: me.roles,
        },
        person,
      };
    } catch {
      return null;
    }
  }
}
