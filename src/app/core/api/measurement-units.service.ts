import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { MeasurementUnit, MeasurementUnitFilter } from '../models/measurement-unit.model';
import { PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class MeasurementUnitsService extends ApiService {
  findAll(filter: MeasurementUnitFilter): Observable<PaginatedResult<MeasurementUnit>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<MeasurementUnit>>(`${this.apiUrl}/measurement-units`, {
      params,
    });
  }
}
