import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import {
  CreateMeasurementUnit,
  MeasurementUnit,
  MeasurementUnitFilter,
  UpdateMeasurementUnit,
} from '../models/measurement-unit.model';
import { PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class MeasurementUnitsService extends ApiService {
  create(dto: CreateMeasurementUnit): Observable<MeasurementUnit> {
    return this.unwrap(
      this.http.post<ApiResponse<MeasurementUnit>>(`${this.apiUrl}/measurement-units`, dto),
    );
  }

  findAll(filter: MeasurementUnitFilter): Observable<PaginatedResult<MeasurementUnit>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<MeasurementUnit>>(`${this.apiUrl}/measurement-units`, {
      params,
    });
  }

  update(id: number, dto: UpdateMeasurementUnit): Observable<MeasurementUnit> {
    return this.unwrap(
      this.http.patch<ApiResponse<MeasurementUnit>>(`${this.apiUrl}/measurement-units/${id}`, dto),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/measurement-units/${id}`);
  }
}
