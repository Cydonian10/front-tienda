import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import {
  Category,
  CategoryFilter,
  CreateCategory,
  UpdateCategory,
} from '../models/category.model';
import { PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService extends ApiService {
  create(dto: CreateCategory): Observable<Category> {
    return this.unwrap(
      this.http.post<ApiResponse<Category>>(`${this.apiUrl}/categories`, dto),
    );
  }

  findAll(filter: CategoryFilter): Observable<PaginatedResult<Category>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<Category>>(`${this.apiUrl}/categories`, {
      params,
    });
  }

  findOne(id: number): Observable<Category> {
    return this.unwrap(
      this.http.get<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`),
    );
  }

  update(id: number, dto: UpdateCategory): Observable<Category> {
    return this.unwrap(
      this.http.patch<ApiResponse<Category>>(
        `${this.apiUrl}/categories/${id}`,
        dto,
      ),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }
}
