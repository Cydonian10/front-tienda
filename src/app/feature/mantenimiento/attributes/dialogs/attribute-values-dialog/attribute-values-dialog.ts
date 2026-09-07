import { Component, inject } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';

import { AttributeWithValues } from '../../../../../core/models/attribute.model';

@Component({
  selector: 'attribute-values-dialog',
  templateUrl: './attribute-values-dialog.html',
})
export class AttributeValuesDialog {
  private readonly dialogRef = inject(DialogRef<void>);
  protected readonly attribute = inject<AttributeWithValues>(DIALOG_DATA);

  protected close(): void {
    this.dialogRef.close();
  }
}

export function openAttributeValuesDialog(
  dialog: Dialog,
  attribute: AttributeWithValues,
): DialogRef<void, AttributeValuesDialog> {
  return dialog.open(AttributeValuesDialog, {
    data: attribute,
    width: '30rem',
    maxWidth: 'calc(100vw - 2rem)',
  });
}
