import { Component, input, output } from '@angular/core';

import { AttributeWithValues } from '../../../../../core/models/attribute.model';

@Component({
  selector: 'attribute-table',
  templateUrl: './attribute-table.component.html',
  host: {
    class: 'block',
  },
})
export class AttributeTable {
  readonly attributes = input.required<AttributeWithValues[]>();
  readonly valuesRequested = output<AttributeWithValues>();
}
