import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CashMovementType } from '../../../../core/models/cash-movement.model';
import { SaleStatus } from '../../../../core/models/sale.model';
import { BusinessDatePipe } from '../../../../shared/pipes/business-date.pipe';
import { WorkerDashboardData } from '../dashboard-contracts';

@Component({
  selector: 'worker-dashboard',
  imports: [BusinessDatePipe, DecimalPipe, RouterLink],
  templateUrl: './worker-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class WorkerDashboard {
  readonly data = input.required<WorkerDashboardData>();
  readonly sessionsRetryRequested = output<void>();
  readonly salesRetryRequested = output<void>();
  readonly movementsRetryRequested = output<void>();

  protected saleStatusLabel(status: SaleStatus): string {
    return { PENDING: 'Pendiente', PAID: 'Pagada', CANCELLED: 'Cancelada' }[status];
  }

  protected movementTypeLabel(type: CashMovementType): string {
    return type === 'income' ? 'Ingreso' : 'Egreso';
  }
}
