import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { AttributeWithValues } from '../../../../../core/models/attribute.model';
import { AttributeTable } from './attribute-table.component';

describe('AttributeTable', () => {
  const attribute: AttributeWithValues = {
    id: 1,
    name: 'Color',
    values: [{ id: 2, value: 'Rojo', attributeId: 1 }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AttributeTable] }).compileComponents();
  });

  it('emits edit and delete actions for the selected attribute', () => {
    const fixture = TestBed.createComponent(AttributeTable);
    fixture.componentRef.setInput('attributes', [attribute]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    let edited: AttributeWithValues | undefined;
    let deleted: AttributeWithValues | undefined;
    component.editRequested.subscribe((value) => (edited = value));
    component.deleteRequested.subscribe((value) => (deleted = value));

    const buttons = fixture.debugElement.queryAll(By.css('tbody button'));
    buttons[0].nativeElement.click();
    buttons[1].nativeElement.click();

    expect(edited).toBe(attribute);
    expect(deleted).toBe(attribute);
  });
});
