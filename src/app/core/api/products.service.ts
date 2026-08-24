import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { CreateProduct, Product, ProductFilter, UpdateProduct } from '../models/product.model';
import { PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ProductsService extends ApiService {
  create(dto: CreateProduct): Observable<Product> {
    return this.unwrap(
      this.http.post<ApiResponse<Product>>(`${this.apiUrl}/products`, dto),
    );
  }

  findAll(filter: ProductFilter): Observable<PaginatedResult<Product>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<Product>>(`${this.apiUrl}/products`, { params });
  }

  findOne(id: number): Observable<Product> {
    return this.unwrap(this.http.get<ApiResponse<Product>>(`${this.apiUrl}/products/${id}`));
  }

  update(id: number, dto: UpdateProduct): Observable<Product> {
    return this.unwrap(
      this.http.patch<ApiResponse<Product>>(`${this.apiUrl}/products/${id}`, dto),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }
}
