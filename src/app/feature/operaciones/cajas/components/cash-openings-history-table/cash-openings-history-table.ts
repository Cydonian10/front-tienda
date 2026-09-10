import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { CashRegisterOpening } from '../../../../../core/models/cash-register.model';
import { BusinessDatePipe } from '../../../../../shared/pipes/business-date.pipe';

@Component({
  selector: 'cash-openings-history-table',
  imports: [BusinessDatePipe, DecimalPipe],
  templateUrl: './cash-openings-history-table.html',
  host: { class: 'block' },
})
export class CashOpeningsHistoryTable {
  readonly openings = input.required<CashRegisterOpening[]>();
}
