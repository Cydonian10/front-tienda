import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ManagementDashboardData,
  ManagementDashboardRole,
} from '../dashboard-contracts';
import { SalesTrendChart } from '../sales-trend-chart/sales-trend-chart';

@Component({
  selector: 'management-dashboard',
  imports: [DecimalPipe, RouterLink, SalesTrendChart],
  templateUrl: './management-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class ManagementDashboard {
  readonly data = input.required<ManagementDashboardData>();
  readonly summaryRetryRequested = output<void>();
  readonly overviewRetryRequested = output<void>();
  readonly salesTrendRetryRequested = output<void>();

  protected roleLabel(role: ManagementDashboardRole): string {
    return role === 'ADMINISTRADOR' ? 'Administrador' : 'Responsable';
  }
}
