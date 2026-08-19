import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AttributeWithValues, AttributeWithValuesFilter } from '../models/attribute.model';
import { PaginatedResult } from '../models/pagination.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AttributesService extends ApiService {
  findAllWithValues(
    filter: AttributeWithValuesFilter,
  ): Observable<PaginatedResult<AttributeWithValues>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedResult<AttributeWithValues>>(`${this.apiUrl}/attributes/batch`, {
      params,
    });
  }
}
