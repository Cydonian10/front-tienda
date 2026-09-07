import { Component, output } from '@angular/core';

import { Icon } from '../../../../../shared/icon/icon';

@Component({
  selector: 'attribute-search',
  imports: [Icon],
  templateUrl: './attribute-search.component.html',
  host: {
    class: 'block',
  },
})
export class AttributeSearch {
  readonly searchChanged = output<string>();

  protected onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }
}
