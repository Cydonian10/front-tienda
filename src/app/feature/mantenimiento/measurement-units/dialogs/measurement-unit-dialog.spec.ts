import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { submit } from '@angular/forms/signals';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MeasurementUnitsService } from '../../../../core/api/measurement-units.service';
import { MeasurementUnit } from '../../../../core/models/measurement-unit.model';
import { MeasurementUnitDialog } from './measurement-unit-dialog';

describe('MeasurementUnitDialog', () => {
  const measurementUnitsService = {
    create: vi.fn(),
    update: vi.fn(),
  };
  const dialogRef = { close: vi.fn() };
  const dialogData: { measurementUnit: MeasurementUnit | null } = {
    measurementUnit: null,
  };
  const createdMeasurementUnit: MeasurementUnit = {
    id: 1,
    name: 'Kilogramo',
    value: 'kg',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    dialogData.measurementUnit = null;
    measurementUnitsService.create.mockReturnValue(of(createdMeasurementUnit));
    measurementUnitsService.update.mockReturnValue(of(createdMeasurementUnit));

    await TestBed.configureTestingModule({
      imports: [MeasurementUnitDialog],
      providers: [
        { provide: MeasurementUnitsService, useValue: measurementUnitsService },
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();
  });

  function createDialog(measurementUnit: MeasurementUnit | null = null) {
    dialogData.measurementUnit = measurementUnit;
    const fixture = TestBed.createComponent(MeasurementUnitDialog);
    fixture.detectChanges();
    return { fixture, dialog: fixture.componentInstance as any };
  }

  function fillForm(dialog: any, name = 'Kilogramo', value = 'kg') {
    dialog.model.set({ name, value });
  }

  it('starts with an empty form when creating a measurement unit', () => {
    const { dialog } = createDialog();

    expect(dialog.model()).toEqual({ name: '', value: '' });
  });

  it('is invalid when one of the required fields is missing', () => {
    const { dialog } = createDialog();
    fillForm(dialog, 'Kilogramo', '');

    expect(dialog.form().invalid()).toBe(true);
    expect(dialog.form().value().value).toBe('');
  });

  it('becomes valid when both fields are completed', () => {
    const { dialog } = createDialog();
    fillForm(dialog);

    expect(dialog.form().valid()).toBe(true);
    expect(dialog.form().invalid()).toBe(false);
  });

  it('calls create with exactly the expected object when saving', async () => {
    const { dialog } = createDialog();
    fillForm(dialog, '  Kilogramo  ', ' kg ');

    await submit(dialog.form);

    expect(measurementUnitsService.create).toHaveBeenCalledTimes(1);
    expect(measurementUnitsService.create).toHaveBeenCalledWith({
      name: 'Kilogramo',
      value: 'kg',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(createdMeasurementUnit);
  });

  it('calls update with the expected object when editing', async () => {
    const measurementUnit = { id: 4, name: 'Metro', value: 'm' };
    const { dialog } = createDialog(measurementUnit);
    fillForm(dialog, 'Centímetro', ' cm ');

    await submit(dialog.form);

    expect(measurementUnitsService.update).toHaveBeenCalledWith(4, {
      name: 'Centímetro',
      value: 'cm',
    });
    expect(measurementUnitsService.create).not.toHaveBeenCalled();
  });

  it('does not call the backend when the form is invalid', async () => {
    const { dialog } = createDialog();

    await submit(dialog.form);

    expect(measurementUnitsService.create).not.toHaveBeenCalled();
    expect(measurementUnitsService.update).not.toHaveBeenCalled();
  });

  it('shows the request error when saving fails', async () => {
    const requestError = new HttpErrorResponse({
      status: 409,
      error: { message: 'La unidad ya existe.' },
    });
    measurementUnitsService.create.mockReturnValue(throwError(() => requestError));
    const { fixture, dialog } = createDialog();
    fillForm(dialog);

    await submit(dialog.form);
    fixture.detectChanges();

    expect(dialog.error()).toBe('La unidad ya existe.');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'La unidad ya existe.',
    );
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
