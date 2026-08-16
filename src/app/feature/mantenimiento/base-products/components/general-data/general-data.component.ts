import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { Brand } from '../../../../../core/models/brand.model';

@Component({
  selector: 'base-product-general-data',
  imports: [ReactiveFormsModule],
  templateUrl: './general-data.component.html',
  host: {
    class: 'block',
  },
})
export class BaseProductGeneralData {
  readonly nameControl = input.required<FormControl<string>>();
  readonly brandIdControl = input.required<FormControl<string>>();
  readonly brands = input.required<Brand[]>();
}
