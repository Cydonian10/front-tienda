import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ManagementDashboardData,
  ManagementDashboardRole,
} from '../dashboard-contracts';

@Component({
  selector: 'management-dashboard',
  imports: [DecimalPipe, RouterLink],
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

  protected roleLabel(role: ManagementDashboardRole): string {
    return role === 'ADMINISTRADOR' ? 'Administrador' : 'Responsable';
  }
}
