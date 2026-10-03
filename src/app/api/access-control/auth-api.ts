import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoginAuthDto } from '../interfaces/access-control/auth.interface';
import { ENVIRONMENT } from '../config/env-dev';

@Service()
export class AuthApi {
  private apirUrl = inject(ENVIRONMENT);
  private http = inject(HttpClient);

  login(dto: LoginAuthDto) {
    const url = `${this.apirUrl.apiUrl}/auth/login`;
    return firstValueFrom(this.http.post(url, dto));
  }
}
