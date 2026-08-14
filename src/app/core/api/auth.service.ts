import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { JwtUser, LoginRequest, LoginResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService extends ApiService {
  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.unwrap(
      this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, dto),
    );
  }

  me(): Observable<JwtUser> {
    return this.unwrap(this.http.get<ApiResponse<JwtUser>>(`${this.apiUrl}/auth/me`));
  }
}
