import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { CreateProduct, Product, ProductFilter } from '../models/product.model';
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

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }
}
