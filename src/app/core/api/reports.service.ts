import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ReportRange,
  ReportsOverview,
  SalesByDay,
  SalesSummary,
  SellerReport,
} from '../models/report.model';
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

  findOverview(range?: ReportRange): Observable<ReportsOverview> {
    return this.unwrap(
      this.http.get<ApiResponse<ReportsOverview>>(`${this.apiUrl}/reports/overview`, {
        params: this.buildParams(range ?? {}),
      }),
    );
  }

  findSalesByDay(range: ReportRange): Observable<SalesByDay[]> {
    return this.unwrap(
      this.http.get<ApiResponse<SalesByDay[]>>(`${this.apiUrl}/reports/sales-by-day`, {
        params: this.buildParams(range),
      }),
    );
  }

  findSellers(range: ReportRange): Observable<SellerReport[]> {
    return this.unwrap(
      this.http.get<ApiResponse<SellerReport[]>>(`${this.apiUrl}/reports/sellers`, {
        params: this.buildParams(range),
      }),
    );
  }
}
