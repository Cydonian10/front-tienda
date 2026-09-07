import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttributesService } from '../../../../../core/api/attributes.service';
import { AttributeWithValues } from '../../../../../core/models/attribute.model';
import { EditAttributeDialog } from './edit-attribute-dialog';

describe('EditAttributeDialog', () => {
  const color: AttributeWithValues = {
    id: 1,
    name: 'Color',
    values: [
      { id: 2, value: 'Rojo', attributeId: 1 },
      { id: 3, value: 'Azul', attributeId: 1 },
    ],
  };
  const attributesService = {
    update: vi.fn(),
    createValue: vi.fn(),
    updateValue: vi.fn(),
    removeValue: vi.fn(),
  };
  const dialogRef = { close: vi.fn() };
  const dialog = { open: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    attributesService.update.mockReturnValue(of({ id: 1, name: 'Tono' }));
    attributesService.createValue.mockReturnValue(
      of({ id: 4, value: 'Verde', attributeId: 1 }),
    );
    attributesService.updateValue.mockReturnValue(
      of({ id: 2, value: 'Bordo', attributeId: 1 }),
    );
    attributesService.removeValue.mockReturnValue(of(null));
    dialog.open.mockReturnValue({ closed: of(true) });

    await TestBed.configureTestingModule({
      imports: [EditAttributeDialog],
      providers: [
        { provide: AttributesService, useValue: attributesService },
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { attribute: color } },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();
  });

  function createDialog() {
    const fixture = TestBed.createComponent(EditAttributeDialog);
    fixture.detectChanges();
    return { fixture, dialog: fixture.componentInstance as any };
  }

  it('sends the trimmed attribute name and updates the local model', async () => {
    const { dialog } = createDialog();
    dialog.nameControl.setValue(' Tono ');

    await dialog.saveName();

    expect(attributesService.update).toHaveBeenCalledWith(1, { name: 'Tono' });
    expect(dialog.nameControl.value).toBe('Tono');
  });

  it('adds a trimmed value and keeps it in the local list', async () => {
    const { dialog } = createDialog();
    dialog.newValueControl.setValue(' Verde ');

    await dialog.addValue();

    expect(attributesService.createValue).toHaveBeenCalledWith({
      value: 'Verde',
      attributeId: 1,
    });
    expect(dialog.values()).toHaveLength(3);
    expect(dialog.values()[2]).toEqual({ id: 4, value: 'Verde', attributeId: 1 });
  });

  it('blocks duplicate values after trimming', async () => {
    const { dialog } = createDialog();
    dialog.newValueControl.setValue(' Rojo ');

    await dialog.addValue();

    expect(attributesService.createValue).not.toHaveBeenCalled();
    expect(dialog.newValueError()).toBe('Los valores no pueden repetirse.');
  });

  it('updates an individual value and preserves its attribute', async () => {
    const { dialog } = createDialog();
    const value = dialog.values()[0];
    dialog.valueControl(value).setValue(' Bordo ');

    await dialog.saveValue(value);

    expect(attributesService.updateValue).toHaveBeenCalledWith(2, { value: 'Bordo' });
    expect(dialog.values()[0]).toEqual({ id: 2, value: 'Bordo', attributeId: 1 });
  });

  it('confirms and removes an individual value locally', async () => {
    const { dialog: component } = createDialog();

    component.removeValue(component.values()[0]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(dialog.open).toHaveBeenCalled();
    expect(attributesService.removeValue).toHaveBeenCalledWith(2);
    expect(component.values()).toHaveLength(1);
  });

  it('shows API errors and keeps the edited name', async () => {
    attributesService.update.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'El nombre ya existe.' },
          }),
      ),
    );
    const { dialog: component } = createDialog();
    component.nameControl.setValue('Tono');

    await component.saveName();

    expect(component.nameControl.value).toBe('Tono');
    expect(component.nameError()).toBe('El nombre ya existe.');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
