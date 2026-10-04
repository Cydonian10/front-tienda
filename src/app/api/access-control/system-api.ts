import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../config/env-dev';
import { firstValueFrom } from 'rxjs';
import { SystemRecord } from '../interfaces/access-control/role.interface';

@Service()
export class SystemApi {
  readonly #http = inject(HttpClient);
  readonly #environment = inject(ENVIRONMENT);

  findAllSystems() {
    const url = `${this.#environment.apiUrl}/systems/mine`;
    return firstValueFrom(this.#http.get<SystemRecord[]>(url));
  }
}
