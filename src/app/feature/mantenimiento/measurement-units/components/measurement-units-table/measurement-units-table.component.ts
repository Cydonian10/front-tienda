import { Component, input, output } from '@angular/core';

import { MeasurementUnit } from '../../../../../core/models/measurement-unit.model';
import { Icon } from '../../../../../shared/icon/icon';

@Component({
  selector: 'measurement-units-table',
  imports: [Icon],
  templateUrl: './measurement-units-table.component.html',
  host: {
    class: 'block',
  },
})
export class MeasurementUnitsTable {
  readonly units = input.required<MeasurementUnit[]>();
  readonly editRequested = output<MeasurementUnit>();
  readonly deleteRequested = output<MeasurementUnit>();
}
