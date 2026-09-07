import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { FormArrayName, FormControlName } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttributesService } from '../../../../../core/api/attributes.service';
import { CreateAttributeDialog } from './create-attribute-dialog';

describe('CreateAttributeDialog', () => {
  const attributesService = { createWithValues: vi.fn() };
  const dialogRef = { close: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    attributesService.createWithValues.mockReturnValue(
      of({
        attribute: { id: 1, name: 'Color', values: [{ id: 2, value: 'Rojo', attributeId: 1 }] },
        created: true,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CreateAttributeDialog],
      providers: [
        { provide: AttributesService, useValue: attributesService },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
  });

  function createDialog() {
    const fixture = TestBed.createComponent(CreateAttributeDialog);
    fixture.detectChanges();
    return { fixture, dialog: fixture.componentInstance as any };
  }

  it('uses a FormArray of controls with the formArrayName pattern', () => {
    const { fixture, dialog } = createDialog();

    expect(dialog.values.length).toBe(1);
    expect(dialog.values.at(0).value).toBe('');
    expect(fixture.debugElement.query(By.directive(FormArrayName))).not.toBeNull();
    expect(fixture.debugElement.queryAll(By.directive(FormControlName))).toHaveLength(2);
    expect(dialog.form.invalid).toBe(true);
  });

  it('blocks empty and duplicate values after trimming', () => {
    const { dialog } = createDialog();
    dialog.form.controls.name.setValue('Color');
    dialog.values.at(0).setValue(' Rojo ');
    dialog.addValue();
    dialog.values.at(1).setValue('Rojo');

    expect(dialog.values.hasError('duplicateValues')).toBe(true);
    expect(dialog.form.invalid).toBe(true);
  });

  it('does not submit without values', async () => {
    const { dialog } = createDialog();
    dialog.form.controls.name.setValue('Color');
    dialog.removeValue(0);

    await dialog.onSubmit();

    expect(dialog.values.hasError('required')).toBe(true);
    expect(attributesService.createWithValues).not.toHaveBeenCalled();
  });

  it('sends trimmed values and closes with the batch result', async () => {
    const { dialog } = createDialog();
    dialog.form.controls.name.setValue(' Color ');
    dialog.values.at(0).setValue(' Rojo ');

    await dialog.onSubmit();

    expect(attributesService.createWithValues).toHaveBeenCalledWith({
      name: 'Color',
      values: [{ value: 'Rojo' }],
    });
    expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({ created: true }));
  });

  it('shows the API error and keeps the dialog open', async () => {
    attributesService.createWithValues.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'El valor ya existe.' },
          }),
      ),
    );
    const { fixture, dialog } = createDialog();
    dialog.form.controls.name.setValue('Color');
    dialog.values.at(0).setValue('Rojo');

    await dialog.onSubmit();
    fixture.detectChanges();

    expect(dialog.error()).toBe('El valor ya existe.');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
