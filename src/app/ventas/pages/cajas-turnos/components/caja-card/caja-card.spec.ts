import { Dialog } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CajaConTurnos, TurnoCaja } from '../../../../../api/interfaces/ventas/caja.interface';
import { AuthorizationService } from '../../../../../auth/services/authorization.service';
import { AbrirTurnoDialog } from '../abrir-turno-dialog/abrir-turno-dialog';
import { CerrarTurnoDialog } from '../cerrar-turno-dialog/cerrar-turno-dialog';
import { CajaCard } from './caja-card';

describe('CajaCard', () => {
  const open = vi.fn();
  const permiso = signal(true);
  const turno: TurnoCaja = {
    id: 't1', usuarioApertura: { id: 'u1', nickName: 'usuario' }, usuarioCierre: null,
    fechaOperativa: '2026-10-31', fechaApertura: '2026-10-31T10:00:00Z', fechaCierre: null,
    saldoInicial: '50.00', efectivoEsperado: '100.00', efectivoContado: null, observacionCierre: null,
  };
  const caja: CajaConTurnos = { id: 'c1', codigo: 'C001', nombre: 'Principal', activo: true, turnos: [turno] };

  beforeEach(() => {
    vi.resetAllMocks();
    permiso.set(true);
    TestBed.configureTestingModule({ providers: [
      { provide: Dialog, useValue: { open } },
      { provide: AuthorizationService, useValue: { hasPermission: () => permiso() } },
    ] });
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

  it('muestra el primer turno abierto del día como Turno #01', () => {
    // Un turno de otro día no forma parte de la numeración actual.
    const turnoAnterior = { ...turno, id: 'anterior', fechaOperativa: '2026-10-30', fechaCierre: '2026-10-30T12:00:00Z' };
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', { ...caja, turnos: [turnoAnterior, turno] });
    fixture.detectChanges();

    const textoTarjeta = fixture.nativeElement.textContent;
    expect(textoTarjeta).toContain('Turno #01');
  });

  it('numera el turno abierto según el orden de apertura de su fecha operativa', () => {
    // Los turnos llegan desordenados y dos comparten la misma fecha de apertura.
    const primero = { ...turno, id: 't1', fechaCierre: '2026-10-31T11:00:00Z' };
    const segundo = { ...turno, id: 't2', fechaCierre: '2026-10-31T12:00:00Z' };
    const tercero = { ...turno, id: 't3', fechaApertura: '2026-10-31T13:00:00Z' };
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', { ...caja, turnos: [tercero, segundo, primero] });
    fixture.detectChanges();

    const textoTarjeta = fixture.nativeElement.textContent;
    expect(textoTarjeta).toContain('Turno #03');
  });

  it('no muestra un número de turno cuando no hay turno abierto', () => {
    // La tarjeta sigue mostrando los datos del último turno cerrado sin numerarlo.
    const turnoCerrado = { ...turno, fechaCierre: '2026-10-31T11:00:00Z' };
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', { ...caja, turnos: [turnoCerrado] });
    fixture.detectChanges();

    const textoTarjeta = fixture.nativeElement.textContent;
    expect(textoTarjeta).not.toContain('Turno #');
    expect(textoTarjeta).toContain('Último efectivo contado');
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

  it('bloquea la acción cuando se revoca el permiso de acceso vigente', () => {
    const fixture = TestBed.createComponent(CajaCard);
    fixture.componentRef.setInput('caja', caja);
    fixture.detectChanges();
    permiso.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    fixture.componentInstance.cerrarTurno();
    expect(open).not.toHaveBeenCalled();
  });
});
