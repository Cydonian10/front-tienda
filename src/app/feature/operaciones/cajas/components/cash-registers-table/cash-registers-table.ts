import { Component, input, output } from '@angular/core';
import { CashRegister } from '../../../../../core/models/cash-register.model';
import { Icon } from '../../../../../shared/icon/icon';

@Component({
  selector: 'cash-registers-table',
  imports: [Icon],
  templateUrl: './cash-registers-table.html',
  host: { class: 'block' },
})
export class CashRegistersTable {
  readonly registers = input.required<CashRegister[]>();
  readonly selectedId = input<number | null>(null);
  readonly canManage = input(false);
  readonly selected = output<CashRegister>();
  readonly editRequested = output<CashRegister>();
  readonly openRequested = output<CashRegister>();
}
