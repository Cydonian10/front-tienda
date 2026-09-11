import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginatedResult } from '../models/pagination.model';
import {
  CancelSale,
  CreateSale,
  PaySale,
  Sale,
  SaleFilter,
  UpdateSale,
} from '../models/sale.model';
import { ApiResponse, ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SalesService extends ApiService {
  findAll(filter: SaleFilter): Observable<PaginatedResult<Sale>> {
    return this.http.get<PaginatedResult<Sale>>(`${this.apiUrl}/sales`, {
      params: this.buildParams(filter),
    });
  }

  findOne(id: number): Observable<Sale> {
    return this.unwrap(this.http.get<ApiResponse<Sale>>(`${this.apiUrl}/sales/${id}`));
  }

  create(dto: CreateSale): Observable<Sale> {
    return this.unwrap(this.http.post<ApiResponse<Sale>>(`${this.apiUrl}/sales`, dto));
  }

  update(id: number, dto: UpdateSale): Observable<Sale> {
    return this.unwrap(this.http.patch<ApiResponse<Sale>>(`${this.apiUrl}/sales/${id}`, dto));
  }

  pay(id: number, dto: PaySale): Observable<Sale> {
    return this.unwrap(this.http.post<ApiResponse<Sale>>(`${this.apiUrl}/sales/${id}/pay`, dto));
  }

  cancel(id: number, dto: CancelSale): Observable<Sale> {
    return this.unwrap(this.http.post<ApiResponse<Sale>>(`${this.apiUrl}/sales/${id}/cancel`, dto));
  }
}
