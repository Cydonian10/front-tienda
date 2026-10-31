import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import type { CajaConTurnos, TurnoCaja } from '../../../../../api/interfaces/ventas/caja.interface';
import { AbrirTurnoDialog } from '../abrir-turno-dialog/abrir-turno-dialog';
import { CerrarTurnoDialog } from '../cerrar-turno-dialog/cerrar-turno-dialog';
import { CajaCard } from './caja-card';

describe('CajaCard', () => {
  const open = vi.fn();
  const turno: TurnoCaja = {
    id: 't1', usuarioApertura: { id: 'u1', nickName: 'usuario' }, usuarioCierre: null,
    fechaOperativa: '2026-10-31', fechaApertura: '2026-10-31T10:00:00Z', fechaCierre: null,
    saldoInicial: '50.00', efectivoEsperado: '100.00', efectivoContado: null, observacionCierre: null,
  };
  const caja: CajaConTurnos = { id: 'c1', codigo: 'C001', nombre: 'Principal', activo: true, turnos: [turno] };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: Dialog, useValue: { open } }] });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('abre el diálogo de cierre para el turno abierto con las opciones de accesibilidad', () => {
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', caja);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Cerrar turno');
    expect(button.disabled).toBe(false);
    button.click();
    expect(open).toHaveBeenCalledWith(CerrarTurnoDialog, expect.objectContaining({
      id: 'cerrar-turno-c1',
      data: { cajaId: 'c1', nombre: 'Principal', turnoId: 't1' },
      ariaModal: true, ariaLabelledBy: 'cerrar-turno-c1-title',
      autoFocus: '[data-dialog-cancel]', restoreFocus: true,
    }));
  });

  it('conserva la apertura cuando no hay turno abierto', () => {
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', { ...caja, turnos: [] });
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Abrir turno');
    button.click();
    expect(open).toHaveBeenCalledWith(AbrirTurnoDialog, expect.objectContaining({
      data: { cajaId: 'c1', nombre: 'Principal', turnos: [] },
    }));
    fixture.componentInstance.cerrarTurno();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('no permite abrir un turno en una caja inactiva', () => {
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', { ...caja, activo: false, turnos: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    fixture.componentInstance.abrirTurno();
    expect(open).not.toHaveBeenCalled();
  });

  it('permite acceder al cierre si una caja inactiva tiene un turno abierto', () => {
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', { ...caja, activo: false });
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(false);
    button.click();
    expect(open).toHaveBeenCalledWith(CerrarTurnoDialog, expect.anything());
  });
});
