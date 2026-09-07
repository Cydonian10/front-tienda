import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  Attribute,
  AttributeBatchResult,
  AttributeFilter,
  AttributeValue,
  AttributeWithValues,
  CreateAttributeValue,
  CreateAttributeBatch,
  UpdateAttribute,
  UpdateAttributeValue,
} from '../models/attribute.model';
import { PaginatedResult } from '../models/pagination.model';
import { ApiResponse, ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AttributesService extends ApiService {
  findAllWithValues(
    filter: AttributeFilter,
  ): Observable<PaginatedResult<AttributeWithValues>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<AttributeWithValues>>(`${this.apiUrl}/attributes/batch`, {
      params,
    });
  }

  createWithValues(dto: CreateAttributeBatch): Observable<AttributeBatchResult> {
    return this.http
      .post<ApiResponse<AttributeWithValues>>(`${this.apiUrl}/attributes/batch`, dto, {
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<ApiResponse<AttributeWithValues>>) => ({
          attribute: response.body!.data,
          created: response.status === 201,
        })),
      );
  }

  update(id: number, dto: UpdateAttribute): Observable<Attribute> {
    return this.unwrap(
      this.http.patch<ApiResponse<Attribute>>(`${this.apiUrl}/attributes/${id}`, dto),
    );
  }

  remove(id: number): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.apiUrl}/attributes/${id}`));
  }

  createValue(dto: CreateAttributeValue): Observable<AttributeValue> {
    return this.unwrap(
      this.http.post<ApiResponse<AttributeValue>>(`${this.apiUrl}/attribute-values`, dto),
    );
  }

  updateValue(id: number, dto: UpdateAttributeValue): Observable<AttributeValue> {
    return this.unwrap(
      this.http.patch<ApiResponse<AttributeValue>>(`${this.apiUrl}/attribute-values/${id}`, dto),
    );
  }

  removeValue(id: number): Observable<void> {
    return this.unwrap(
      this.http.delete<ApiResponse<void>>(`${this.apiUrl}/attribute-values/${id}`),
    );
  }
}
