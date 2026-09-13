import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { CashRegisterOpening } from '../../../../../core/models/cash-register.model';
import { BusinessDatePipe } from '../../../../../shared/pipes/business-date.pipe';

@Component({
  selector: 'cash-sessions-table',
  imports: [BusinessDatePipe, DecimalPipe],
  templateUrl: './cash-sessions-table.html',
  host: { class: 'block' },
})
export class CashSessionsTable {
  readonly openings = input.required<CashRegisterOpening[]>();
  readonly detailRequested = output<CashRegisterOpening>();
}
