import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { CashResponsible } from '../models/cash-register.model';
import { Person } from '../models/people.model';

@Injectable({ providedIn: 'root' })
export class PeopleService extends ApiService {
  findCashResponsibles(): Observable<CashResponsible[]> {
    return this.unwrap(
      this.http.get<ApiResponse<CashResponsible[]>>(
        `${this.apiUrl}/people/cash-responsibles`,
      ),
    );
  }

  findOne(id: number): Observable<Person> {
    return this.unwrap(this.http.get<ApiResponse<Person>>(`${this.apiUrl}/people/${id}`));
  }
}
