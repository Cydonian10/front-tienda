import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../config/env-dev';
import { firstValueFrom } from 'rxjs';

@Service()
export class SystemApi {
  readonly #http = inject(HttpClient);
  readonly #environment = inject(ENVIRONMENT);

  findAllSystems() {
    const url = `${this.#environment.apiUrl}/systems`;
    return firstValueFrom(this.#http.get<any[]>(url));
  }
}
