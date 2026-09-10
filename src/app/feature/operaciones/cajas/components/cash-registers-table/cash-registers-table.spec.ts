import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CashRegister } from '../../../../../core/models/cash-register.model';
import { CashRegistersTable } from './cash-registers-table';

describe('CashRegistersTable', () => {
  const register: CashRegister = { id: 1, code: 'CAJA-01', name: 'Principal', active: true, openOpening: null };
  beforeEach(async () => TestBed.configureTestingModule({ imports: [CashRegistersTable] }).compileComponents());

  it('emits selection and the available opening action', () => {
    const fixture = TestBed.createComponent(CashRegistersTable);
    fixture.componentRef.setInput('registers', [register]); fixture.detectChanges();
    let selected: CashRegister | undefined; let opened: CashRegister | undefined;
    fixture.componentInstance.selected.subscribe((value) => selected = value);
    fixture.componentInstance.openRequested.subscribe((value) => opened = value);
    fixture.debugElement.query(By.css('tbody tr')).nativeElement.click();
    fixture.debugElement.query(By.css('tbody button')).nativeElement.click();
    expect(selected).toBe(register); expect(opened).toBe(register);
  });

  it('hides administrative editing for workers and blocks already open registers', () => {
    const fixture = TestBed.createComponent(CashRegistersTable);
    fixture.componentRef.setInput('registers', [{ ...register, openOpening: { id: 2, openedAt: '', openingAmount: 0, status: 'open', responsible: { id: 1, firstName: 'Ana', lastName: 'Pérez' } } }]);
    fixture.componentRef.setInput('canManage', false); fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('tbody button'))).toHaveLength(0);
  });
});
