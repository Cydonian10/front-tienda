import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../config/env-dev';
import { CreateUserDto, UpdateUserDto, Usuario } from '../interfaces/access-control/usuario.interface';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  readonly #http = inject(HttpClient);
  readonly ENV = inject(ENVIRONMENT);

  findUsuarios() {
    return firstValueFrom(this.#http.get<Usuario[]>(`${this.ENV.apiUrl}/users`));
  }

  create(dto: CreateUserDto) {
    return firstValueFrom(this.#http.post<Usuario>(`${this.ENV.apiUrl}/users`, dto));
  }

  update(dto: UpdateUserDto, userId: string) {
    return firstValueFrom(this.#http.patch<Usuario>(`${this.ENV.apiUrl}/users/${userId}`, dto));
  }
}
