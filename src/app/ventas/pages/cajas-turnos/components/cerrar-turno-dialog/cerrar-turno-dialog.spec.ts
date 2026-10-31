import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { CajaTurnosApi } from '../../../../../api/ventas/caja-turnos/caja-turnos-api';
import { CerrarTurnoDialog, diferenciaFormateada, importeEnCentavos } from './cerrar-turno-dialog';

describe('CerrarTurnoDialog', () => {
  const resumen = vi.fn();
  const close = vi.fn();
  const datos = {
    id: 't1', cajaId: 'c1', saldoInicial: '50.00', cobrosEfectivo: '100.00',
    vueltosEfectivo: '1.00', ingresosManuales: '20.00', egresosManuales: '10.00',
    reintegrosEfectivo: '2.00', efectivoEsperado: '157.00',
  };
  let client: QueryClient;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient();
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: CajaTurnosApi, useValue: { resumen } },
      { provide: DIALOG_DATA, useValue: { cajaId: 'c1', nombre: 'Caja principal', turnoId: 't1' } },
      { provide: DialogRef, useValue: { id: 'cerrar-turno-c1', close } },
    ] });
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); });

  it('muestra la carga y después el desglose real y el formulario', async () => {
    let resolver!: (value: typeof datos) => void;
    resumen.mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    const fixture = TestBed.createComponent(CerrarTurnoDialog);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando el resumen');
    expect(fixture.nativeElement.textContent).not.toContain('S/ 0');
    resolver(datos);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('157.00');
    });
    expect(resumen).toHaveBeenCalledWith('c1', 't1');
    for (const importe of ['50.00', '100.00', '1.00', '20.00', '10.00', '2.00']) {
      expect(fixture.nativeElement.textContent).toContain(importe);
    }
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.btn-primary').disabled).toBe(true);
  });

  it('permite reintentar si falla la consulta sin mostrar valores inventados', async () => {
    resumen.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(datos);
    const fixture = TestBed.createComponent(CerrarTurnoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar');
    });
    expect(fixture.nativeElement.textContent).not.toContain('S/ 0');
    const reintentar = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((button) => button.textContent?.includes('Reintentar'));
    reintentar?.click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('157.00');
    });
  });

  it('distingue un turno cerrado y permite cancelar', async () => {
    resumen.mockRejectedValue(new HttpErrorResponse({ status: 409 }));
    const fixture = TestBed.createComponent(CerrarTurnoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Este turno ya fue cerrado');
    });
    expect(fixture.nativeElement.textContent).not.toContain('Reintentar');
    fixture.nativeElement.querySelector('[data-dialog-cancel]').click();
    expect(close).toHaveBeenCalled();
  });

  it('valida el contado y la observación según el contrato', () => {
    const fixture = TestBed.createComponent(CerrarTurnoDialog);
    const dialog = fixture.componentInstance;
    for (const valor of ['0', '0.00', '12.5', '9999999999999999.99']) {
      dialog.efectivoContado.set(valor);
      expect(dialog.formularioValido()).toBe(true);
    }
    for (const valor of ['', '-1', '1.001', '1.', '.5', '1,50', '10000000000000000', 'abc']) {
      dialog.efectivoContado.set(valor);
      expect(dialog.formularioValido()).toBe(false);
    }
    dialog.efectivoContado.set('0');
    dialog.observacionCierre.set('a'.repeat(500));
    expect(dialog.formularioValido()).toBe(true);
    dialog.observacionCierre.set('a'.repeat(501));
    expect(dialog.formularioValido()).toBe(false);
  });

  it('calcula faltante, sobrante y cuadre exactos incluso con centavos y valores grandes', async () => {
    resumen.mockResolvedValue({ ...datos, efectivoEsperado: '0.30' });
    const fixture = TestBed.createComponent(CerrarTurnoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.resumenQuery.data()).toBeDefined());
    const dialog = fixture.componentInstance;
    for (const [contado, texto] of [['0.10', '−S/ 0.20 · Faltante'], ['0.31', '+S/ 0.01 · Sobrante'], ['0.30', 'S/ 0.00 · Sin diferencia']]) {
      dialog.efectivoContado.set(contado);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(texto);
    }
    expect(diferenciaFormateada(importeEnCentavos('9999999999999999.99')! - importeEnCentavos('-0.01', true)!))
      .toBe('+S/ 10000000000000000.00');
  });

  it('muestra errores accesibles al ingresar valores inválidos', async () => {
    resumen.mockResolvedValue(datos);
    const fixture = TestBed.createComponent(CerrarTurnoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    });
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = '-1';
    input.dispatchEvent(new Event('input'));
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'a'.repeat(501);
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('importe no negativo');
    expect(fixture.nativeElement.textContent).toContain('500 caracteres');
    expect(fixture.componentInstance.formularioValido()).toBe(false);
  });
});
