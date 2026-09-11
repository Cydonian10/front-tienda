import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { CashResponsible } from '../models/cash-register.model';
import { PaginatedResult } from '../models/pagination.model';
import { Person, PersonFilter } from '../models/people.model';

@Injectable({ providedIn: 'root' })
export class PeopleService extends ApiService {
  findAll(filter: PersonFilter): Observable<PaginatedResult<Person>> {
    return this.http.get<PaginatedResult<Person>>(`${this.apiUrl}/people`, {
      params: this.buildParams(filter),
    });
  }

  findCashResponsibles(): Observable<CashResponsible[]> {
    return this.unwrap(
      this.http.get<ApiResponse<CashResponsible[]>>(`${this.apiUrl}/people/cash-responsibles`),
    );
  }

  findOne(id: number): Observable<Person> {
    return this.unwrap(this.http.get<ApiResponse<Person>>(`${this.apiUrl}/people/${id}`));
  }
}
