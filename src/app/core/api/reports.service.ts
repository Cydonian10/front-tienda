import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SalesSummary } from '../models/report.model';
import { ApiResponse, ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService extends ApiService {
  findSalesSummary(from: string, to: string): Observable<SalesSummary> {
    return this.unwrap(
      this.http.get<ApiResponse<SalesSummary>>(`${this.apiUrl}/reports/sales-summary`, {
        params: this.buildParams({ from, to }),
      }),
    );
  }
}
