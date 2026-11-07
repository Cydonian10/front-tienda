import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CajaTurnosApi } from '../../../../../api/ventas/caja-turnos/caja-turnos-api';
import { CajaApi } from '../../../../../api/ventas/caja/caja-api';
import { ToastService } from '../../../../../shared/services/toast/toast.service';
import { AbrirTurnoDialog } from './abrir-turno-dialog';

describe('AbrirTurnoDialog', () => {
  const abrir = vi.fn();
  const close = vi.fn();
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient();
    client.setQueryData(['cajas', 'responsables'], [{ id: 'u2', nickName: 'Luis' }]);
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: CajaTurnosApi, useValue: { abrir } },
      { provide: CajaApi, useValue: { responsables: vi.fn().mockResolvedValue([{ id: 'u2', nickName: 'Luis' }]) } },
      { provide: ToastService, useValue: { success: vi.fn() } },
      { provide: DIALOG_DATA, useValue: { cajaId: 'c1', nombre: 'Caja secundaria', turnos: [] } },
      { provide: DialogRef, useValue: { id: 'abrir-turno-c1', close, disableClose: false } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  it('envía el saldo y cierra el modal al abrir el turno', async () => {
    abrir.mockResolvedValue({ id: 't1' });
    const fixture = TestBed.createComponent(AbrirTurnoDialog);
    fixture.detectChanges();
    fixture.componentInstance.responsableId.set('u2');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = '100.50';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await vi.waitFor(() => expect(close).toHaveBeenCalledWith({ id: 't1' }));
    expect(abrir).toHaveBeenCalledWith('c1', { responsableId: 'u2', saldoInicial: '100.50' });
  });

  it('muestra el error del servidor sin cerrar el modal', async () => {
    abrir.mockRejectedValue(new HttpErrorResponse({ status: 400, error: { message: 'El saldo inicial es obligatorio para el primer turno del día' } }));
    const fixture = TestBed.createComponent(AbrirTurnoDialog);
    fixture.detectChanges();
    fixture.componentInstance.saldoInicial.set('100');
    fixture.componentInstance.responsableId.set('u2');
    await fixture.componentInstance.submitForm(new Event('submit'));
    fixture.detectChanges();
    expect(abrir).toHaveBeenCalledWith('c1', { responsableId: 'u2', saldoInicial: '100' });
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('saldo inicial es obligatorio');
    expect(close).not.toHaveBeenCalled();
  });

  it('valida el formato del saldo antes de llamar a la API', async () => {
    const fixture = TestBed.createComponent(AbrirTurnoDialog);
    fixture.componentInstance.saldoInicial.set('-1');
    await fixture.componentInstance.submitForm(new Event('submit'));
    expect(fixture.componentInstance.serverError()).toContain('saldo válido');
    expect(abrir).not.toHaveBeenCalled();
  });

  it('exige seleccionar un responsable disponible', async () => {
    const fixture = TestBed.createComponent(AbrirTurnoDialog);
    fixture.detectChanges();
    fixture.componentInstance.saldoInicial.set('100');
    fixture.componentInstance.responsableId.set('inexistente');
    await fixture.componentInstance.submitForm(new Event('submit'));
    const mensaje = fixture.componentInstance.serverError();
    expect(mensaje).toContain('Selecciona un responsable');
    expect(abrir).not.toHaveBeenCalled();
  });

  it('muestra y hereda el efectivo del último turno del día sin enviarlo', async () => {
    const data = TestBed.inject(DIALOG_DATA);
    data.turnos = [
      { id: 't1', fechaOperativa: '2026-10-31', fechaApertura: '2026-10-31T10:00:00Z', efectivoContado: '10.00' },
      { id: 't2', fechaOperativa: '2026-10-31', fechaApertura: '2026-10-31T12:00:00Z', efectivoContado: '0.00' },
      { id: 't3', fechaOperativa: '2026-10-30', fechaApertura: '2026-10-31T13:00:00Z', efectivoContado: '99.00' },
    ];
    abrir.mockResolvedValue({ id: 'nuevo' });
    const fixture = TestBed.createComponent(AbrirTurnoDialog);
    fixture.componentInstance.fechaOperativa.set('2026-10-31');
    fixture.componentInstance.responsableId.set('u2');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('0.00');
    expect(input.readOnly).toBe(true);
    await fixture.componentInstance.submitForm(new Event('submit'));
    expect(abrir).toHaveBeenCalledWith('c1', { responsableId: 'u2' });
  });

  it('impide abrir si el turno anterior no tiene efectivo contado', async () => {
    TestBed.inject(DIALOG_DATA).turnos = [
      { id: 't1', fechaOperativa: '2026-10-31', fechaApertura: '2026-10-31T10:00:00Z', efectivoContado: null },
    ];
    const fixture = TestBed.createComponent(AbrirTurnoDialog);
    fixture.componentInstance.fechaOperativa.set('2026-10-31');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no tiene efectivo contado');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    await fixture.componentInstance.submitForm(new Event('submit'));
    expect(abrir).not.toHaveBeenCalled();
  });

  it('exige saldo si solo existen turnos de días anteriores', async () => {
    TestBed.inject(DIALOG_DATA).turnos = [
      { id: 't1', fechaOperativa: '2026-10-30', fechaApertura: '2026-10-30T10:00:00Z', efectivoContado: '20.00' },
    ];
    const fixture = TestBed.createComponent(AbrirTurnoDialog);
    fixture.componentInstance.fechaOperativa.set('2026-10-31');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input').readOnly).toBe(false);
    await fixture.componentInstance.submitForm(new Event('submit'));
    expect(fixture.componentInstance.serverError()).toContain('saldo válido');
    expect(abrir).not.toHaveBeenCalled();
  });
});
