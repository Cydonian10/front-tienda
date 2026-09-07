import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { describe, expect, it, vi } from 'vitest';

import { AttributeWithValues } from '../../../../../core/models/attribute.model';
import { AttributeValuesDialog, openAttributeValuesDialog } from './attribute-values-dialog';

describe('AttributeValuesDialog', () => {
  const attribute: AttributeWithValues = {
    id: 1,
    name: 'Color',
    values: [{ id: 2, value: 'Rojo', attributeId: 1 }],
  };

  it('opens a dialog with the selected attribute and allows closing it', async () => {
    const dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AttributeValuesDialog],
      providers: [
        { provide: DIALOG_DATA, useValue: attribute },
        { provide: DialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AttributeValuesDialog);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;

    expect(fixture.nativeElement.textContent).toContain('Valores de Color');
    component.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('uses the CDK default close behavior for Escape and backdrop clicks', () => {
    const dialog = { open: vi.fn() } as unknown as Dialog;

    openAttributeValuesDialog(dialog, attribute);

    const [, config] = (dialog.open as any).mock.calls[0];
    expect(config.data).toBe(attribute);
    expect(config.disableClose).toBeUndefined();
  });
});
