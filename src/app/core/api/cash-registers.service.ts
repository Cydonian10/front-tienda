import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import {
  CashRegister,
  CreateCashRegister,
  UpdateCashRegister,
} from '../models/cash-register.model';

@Injectable({ providedIn: 'root' })
export class CashRegistersService extends ApiService {
  findAll(): Observable<CashRegister[]> {
    return this.unwrap(
      this.http.get<ApiResponse<CashRegister[]>>(`${this.apiUrl}/cash-registers`),
    );
  }

  create(dto: CreateCashRegister): Observable<CashRegister> {
    return this.unwrap(
      this.http.post<ApiResponse<CashRegister>>(`${this.apiUrl}/cash-registers`, dto),
    );
  }

  update(id: number, dto: UpdateCashRegister): Observable<CashRegister> {
    return this.unwrap(
      this.http.patch<ApiResponse<CashRegister>>(
        `${this.apiUrl}/cash-registers/${id}`,
        dto,
      ),
    );
  }
}
