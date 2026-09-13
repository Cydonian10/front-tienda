import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CashMovement,
  CashMovementFilter,
  CreateCashMovement,
} from '../models/cash-movement.model';
import { PaginatedResult } from '../models/pagination.model';
import { ApiResponse, ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CashMovementsService extends ApiService {
  findAll(filter: CashMovementFilter): Observable<PaginatedResult<CashMovement>> {
    return this.http.get<PaginatedResult<CashMovement>>(`${this.apiUrl}/cash-movements`, {
      params: this.buildParams(filter),
    });
  }

  create(dto: CreateCashMovement): Observable<CashMovement> {
    return this.unwrap(
      this.http.post<ApiResponse<CashMovement>>(`${this.apiUrl}/cash-movements`, dto),
    );
  }
}
