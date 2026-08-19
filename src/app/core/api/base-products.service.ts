import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import {
  BaseProduct,
  BaseProductDetail,
  BaseProductFilter,
  CreateBaseProduct,
  CreateBaseProductResponse,
} from '../models/base-product.model';
import { PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class BaseProductsService extends ApiService {
  create(dto: CreateBaseProduct): Observable<CreateBaseProductResponse> {
    return this.http.post<CreateBaseProductResponse>(`${this.apiUrl}/base-products`, dto);
  }

  findAll(filter: BaseProductFilter): Observable<PaginatedResult<BaseProduct>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<BaseProduct>>(`${this.apiUrl}/base-products`, { params });
  }

  findOne(id: number): Observable<BaseProduct> {
    return this.unwrap(
      this.http.get<ApiResponse<BaseProduct>>(`${this.apiUrl}/base-products/${id}`),
    );
  }

  findDetail(id: number): Observable<BaseProductDetail> {
    return this.unwrap(
      this.http.get<ApiResponse<BaseProductDetail>>(`${this.apiUrl}/base-products/${id}/detail`),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/base-products/${id}`);
  }
}
