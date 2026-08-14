import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, ApiService } from './api.service';
import { Person } from '../models/people.model';

@Injectable({ providedIn: 'root' })
export class PeopleService extends ApiService {
  findOne(id: number): Observable<Person> {
    return this.unwrap(this.http.get<ApiResponse<Person>>(`${this.apiUrl}/people/${id}`));
  }
}
