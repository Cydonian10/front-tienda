import { Component, inject, input } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { MeasurementUnit } from '../../../../../core/models/measurement-unit.model';
import { Icon } from '../../../../../shared/icon/icon';

export interface UnitRowControls {
  unitId: FormControl<string>;
  factor: FormControl<number>;
  isMain: FormControl<boolean>;
}

export function createUnitRow(
  formBuilder: FormBuilder,
  isMain: boolean,
): FormGroup<UnitRowControls> {
  return formBuilder.nonNullable.group({
    unitId: [''],
    factor: [1],
    isMain: [isMain],
  });
}

@Component({
  selector: 'base-product-units-editor',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './units-editor.component.html',
  host: {
    class: 'block',
  },
})
export class BaseProductUnitsEditor {
  private readonly formBuilder = inject(FormBuilder);

  readonly units = input.required<MeasurementUnit[]>();
  readonly unitRows = input.required<FormArray<FormGroup<UnitRowControls>>>();

  protected addUnitRow(): void {
    this.unitRows().push(createUnitRow(this.formBuilder, false));
  }

  protected removeUnitRow(index: number): void {
    if (this.unitRows().length === 1) {
      return;
    }
    const wasMain = this.unitRows().at(index).controls.isMain.value;
    this.unitRows().removeAt(index);
    if (wasMain && this.unitRows().length > 0) {
      this.unitRows().at(0).controls.isMain.setValue(true);
    }
  }

  protected setMainRow(index: number): void {
    this.unitRows().controls.forEach((row, i) => {
      row.controls.isMain.setValue(i === index);
    });
  }

  protected isUnitUsed(unitId: number, index: number): boolean {
    if (!unitId) {
      return false;
    }
    return this.unitRows().controls.some(
      (row, i) => i !== index && Number(row.controls.unitId.value) === unitId,
    );
  }
}
