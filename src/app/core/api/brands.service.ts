import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { Brand, BrandFilter, CreateBrand, UpdateBrand } from '../models/brand.model';
import { PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class BrandsService extends ApiService {
  create(dto: CreateBrand): Observable<Brand> {
    return this.unwrap(this.http.post<ApiResponse<Brand>>(`${this.apiUrl}/brands`, dto));
  }

  findAll(filter: BrandFilter): Observable<PaginatedResult<Brand>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<Brand>>(`${this.apiUrl}/brands`, {
      params,
    });
  }

  findOne(id: number): Observable<Brand> {
    return this.unwrap(this.http.get<ApiResponse<Brand>>(`${this.apiUrl}/brands/${id}`));
  }

  update(id: number, dto: UpdateBrand): Observable<Brand> {
    return this.unwrap(this.http.patch<ApiResponse<Brand>>(`${this.apiUrl}/brands/${id}`, dto));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/brands/${id}`);
  }
}
