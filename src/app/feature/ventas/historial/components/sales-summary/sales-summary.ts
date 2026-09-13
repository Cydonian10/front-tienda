import { Component, input } from '@angular/core';

import { SalesSummary } from '../../../../../core/models/report.model';

@Component({
  selector: 'sales-summary',
  templateUrl: './sales-summary.html',
  host: {
    class: 'block',
  },
})
export class SalesSummaryComponent {
  readonly summary = input<SalesSummary | null>(null);
}
