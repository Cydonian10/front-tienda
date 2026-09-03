import { Component, output } from '@angular/core';

import { Icon } from '../../../../../shared/icon/icon';

@Component({
  selector: 'measurement-units-search',
  imports: [Icon],
  templateUrl: './measurement-units-search.component.html',
  host: {
    class: 'block',
  },
})
export class MeasurementUnitsSearch {
  readonly searchChanged = output<string>();

  protected onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }
}
