import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoginAuthDto } from '../interfaces/access-control/auth.interface';

export class AuthService {
  private http = inject(HttpClient);

  login(dto: LoginAuthDto) {
    return firstValueFrom(this.http.post('', dto));
  }
}
