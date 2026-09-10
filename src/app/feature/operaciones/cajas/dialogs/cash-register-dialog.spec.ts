import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { CashRegisterDialog } from './cash-register-dialog';

describe('CashRegisterDialog', () => {
  const service = { create: vi.fn(), update: vi.fn() }; const dialogRef = { close: vi.fn() };
  beforeEach(async () => { vi.clearAllMocks(); service.create.mockReturnValue(of({ id: 1, code: 'CAJA-01', name: 'Principal', active: true, openOpening: null })); await TestBed.configureTestingModule({ imports: [CashRegisterDialog], providers: [{ provide: CashRegistersService, useValue: service }, { provide: DialogRef, useValue: dialogRef }, { provide: DIALOG_DATA, useValue: null }] }).compileComponents(); });

  it('rejects whitespace-only code and name', () => {
    const fixture = TestBed.createComponent(CashRegisterDialog); const dialog = fixture.componentInstance as any;
    dialog.form.setValue({ code: '   ', name: '  ', active: true });
    expect(dialog.form.invalid).toBe(true);
  });

  it('trims values before creating a register', async () => {
    const fixture = TestBed.createComponent(CashRegisterDialog); const dialog = fixture.componentInstance as any;
    dialog.form.setValue({ code: ' CAJA-01 ', name: ' Principal ', active: true }); await dialog.submit();
    expect(service.create).toHaveBeenCalledWith({ code: 'CAJA-01', name: 'Principal' });
  });

  it('does not deactivate a register with an open session', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CashRegisterDialog],
      providers: [
        { provide: CashRegistersService, useValue: service },
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: DIALOG_DATA,
          useValue: {
            register: {
              id: 1,
              code: 'CAJA-01',
              name: 'Principal',
              active: true,
              openOpening: {
                id: 2,
                openedAt: '2026-09-10T03:19:00.000Z',
                openingAmount: 0,
                status: 'open',
                responsible: { id: 1, firstName: 'Ana', lastName: 'Pérez' },
              },
            },
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashRegisterDialog);
    const dialog = fixture.componentInstance as any;
    dialog.form.controls.active.setValue(false);

    await dialog.submit();

    expect(service.update).not.toHaveBeenCalled();
    expect(dialog.error()).toContain('sesión abierta');
  });
});
