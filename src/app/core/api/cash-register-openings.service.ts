import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import {
  CashRegisterOpening,
  CashRegisterOpeningFilter,
  CreateCashRegisterOpening,
} from '../models/cash-register.model';

@Injectable({ providedIn: 'root' })
export class CashRegisterOpeningsService extends ApiService {
  findAll(
    filter: CashRegisterOpeningFilter,
  ): Observable<CashRegisterOpening[]> {
    return this.unwrap(
      this.http.get<ApiResponse<CashRegisterOpening[]>>(
        `${this.apiUrl}/cash-register-openings`,
        { params: this.buildParams(filter) },
      ),
    );
  }

  create(dto: CreateCashRegisterOpening): Observable<CashRegisterOpening> {
    return this.unwrap(
      this.http.post<ApiResponse<CashRegisterOpening>>(
        `${this.apiUrl}/cash-register-openings`,
        dto,
      ),
    );
  }
}
