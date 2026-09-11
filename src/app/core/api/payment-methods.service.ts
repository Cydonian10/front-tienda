import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PaymentMethod } from '../models/payment-method.model';
import { ApiResponse, ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PaymentMethodsService extends ApiService {
  findActive(): Observable<PaymentMethod[]> {
    return this.unwrap(
      this.http.get<ApiResponse<PaymentMethod[]>>(`${this.apiUrl}/payment-methods`),
    );
  }
}
