import { DialogRef } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import type { CajaConTurnos, TurnoCaja } from '../../../../../api/interfaces/ventas/caja.interface';
import { CajaApi } from '../../../../../api/ventas/caja/caja-api';
import { AuthStore } from '../../../../../store/auth/auth.store';
import { cajasQueryKey } from '../../../../actions/use-cajas-action';
import { RegistrarMovimientoDialog } from './registrar-movimiento-dialog';
import { RegistrarMovimientoCajaAction } from '../../../../actions/use-movimientos-caja-action';
import { AuthorizationService } from '../../../../../auth/services/authorization.service';
import { ToastService } from '../../../../../shared/services/toast/toast.service';

describe('RegistrarMovimientoDialog', () => {
  const turno = (id: string, fechaCierre: string | null, responsable = 'Ana'): TurnoCaja => ({
    id,
    fechaCierre,
    responsable: { id: 'u1', nickName: responsable },
    usuarioApertura: { id: 'u1', nickName: responsable },
    usuarioCierre: null,
    fechaOperativa: '2026-11-07',
    fechaApertura: id === 't1' ? '2026-11-07T09:00:00Z' : '2026-11-07T10:00:00Z',
    saldoInicial: '100.00',
    efectivoEsperado: '100.00',
    efectivoContado: null,
    observacionCierre: null,
  });
  const cajas: CajaConTurnos[] = [
    {
      id: 'c1',
      nombre: 'Caja principal',
      codigo: 'C001',
      activo: true,
      turnos: [turno('t1', '2026-11-07T09:30:00Z'), turno('t2', null)],
    },
    {
      id: 'c2',
      nombre: 'Caja cerrada',
      codigo: 'C002',
      activo: true,
      turnos: [turno('t3', '2026-11-07T10:30:00Z')],
    },
  ];
  let client: QueryClient;
  const list = vi.fn();
  const close = vi.fn();
  const registrar = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    list.mockResolvedValue(cajas);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: CajaApi, useValue: { list } },
        { provide: DialogRef, useValue: { id: 'movimiento', close } },
        { provide: AuthorizationService, useValue: { hasPermission: () => true } },
        { provide: ToastService, useValue: { success: vi.fn() } },
        {
          provide: RegistrarMovimientoCajaAction,
          useValue: {
            registrar,
            bloqueado: signal(false),
            enviando: signal(false),
            pendiente: signal(null),
            error: signal(''),
          },
        },
      ],
    });
    TestBed.inject(AuthStore).setProfile({ nickName: 'Gabriel' } as never);
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('muestra solo cajas abiertas y conserva los datos al regresar', async () => {
    // Seleccionar una caja con turno abierto y consultar su responsable.
    const fixture = TestBed.createComponent(RegistrarMovimientoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.cajasAbiertas()).toHaveLength(1));
    fixture.detectChanges();
    const opciones = Array.from(
      fixture.nativeElement.querySelectorAll('select option'),
    ) as HTMLOptionElement[];
    expect(opciones.map((opcion) => opcion.textContent?.trim())).toEqual([
      'Selecciona una caja',
      'Caja principal · C001',
    ]);
    fixture.componentInstance.cajaId.set('c1');
    fixture.detectChanges();
    const resumenCaja = fixture.nativeElement.textContent;
    expect(resumenCaja).toContain('Ana');
    expect(resumenCaja).toContain('#02');

    // Completar el segundo paso y volver sin perder la información.
    fixture.componentInstance.continuar();
    fixture.componentInstance.tipo.set('egreso');
    fixture.componentInstance.monto.set('12.50');
    fixture.componentInstance.motivo.set('Compra menor');
    fixture.detectChanges();
    const contenidoMovimiento = fixture.nativeElement.textContent;
    expect(contenidoMovimiento).toContain('Gabriel');
    expect(contenidoMovimiento).toContain('Ana');
    const botonRegistro: HTMLButtonElement = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((boton) =>
      (boton as HTMLButtonElement).textContent?.includes('Registrar movimiento'),
    ) as HTMLButtonElement;
    expect(botonRegistro.disabled).toBe(false);
    fixture.componentInstance.volver();
    fixture.componentInstance.continuar();
    fixture.detectChanges();
    const montoRecuperado = (
      fixture.nativeElement.querySelector('#movimiento-field-monto') as HTMLInputElement
    ).value;
    const motivoRecuperado = (
      fixture.nativeElement.querySelector('#movimiento-field-motivo') as HTMLInputElement
    ).value;
    const tipoRecuperado = (
      fixture.nativeElement.querySelector('#movimiento-field-tipo') as HTMLSelectElement
    ).value;
    expect(montoRecuperado).toBe('12.50');
    expect(motivoRecuperado).toBe('Compra menor');
    expect(tipoRecuperado).toBe('egreso');
    expect(list).toHaveBeenCalledWith({ estado: 'todas' });
  });

  it('registra el movimiento válido y cierra al confirmarse', async () => {
    // Seleccionar turno y enviar los datos sin alterar la identidad del usuario.
    registrar.mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegistrarMovimientoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.cajasAbiertas()).toHaveLength(1));
    const dialogo = fixture.componentInstance;
    dialogo.cajaId.set('c1');
    dialogo.continuar();
    dialogo.tipo.set('ingreso');
    dialogo.monto.set('10.00');
    dialogo.motivo.set(' Fondo ');
    await dialogo.registrar();
    expect(registrar).toHaveBeenCalledWith(
      { turnoId: 't2', tipo: 'ingreso', importe: '10.00', motivo: 'Fondo' },
      'c1',
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it('informa cuando no hay cajas abiertas y no permite continuar', async () => {
    // Cargar una respuesta sin turnos abiertos.
    list.mockResolvedValue([cajas[1]]);
    const fixture = TestBed.createComponent(RegistrarMovimientoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.cajasQuery.isSuccess()).toBe(true));
    fixture.detectChanges();
    const mensaje = fixture.nativeElement.textContent;
    expect(mensaje).toContain('No hay cajas con turnos abiertos');
    fixture.componentInstance.continuar();
    expect(fixture.componentInstance.paso()).toBe(1);
  });

  it('muestra el error de consulta y permite reintentar', async () => {
    // Simular un fallo y recuperar la lista desde el botón de reintento.
    list.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue(cajas);
    const fixture = TestBed.createComponent(RegistrarMovimientoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.cajasQuery.isError()).toBe(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No se pudieron cargar',
    );
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    await vi.waitFor(() => expect(fixture.componentInstance.cajasQuery.isSuccess()).toBe(true));
    expect(fixture.componentInstance.cajasAbiertas()).toHaveLength(1);
  });

  it('valida monto y motivo y evita continuar con una selección obsoleta', async () => {
    // Verificar las validaciones sin depender de operaciones de escritura.
    const fixture = TestBed.createComponent(RegistrarMovimientoDialog);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.cajasQuery.isSuccess()).toBe(true));
    const dialogo = fixture.componentInstance;
    dialogo.monto.set('0.00');
    dialogo.motivo.set('  ');
    expect(dialogo.montoValido()).toBe(false);
    expect(dialogo.motivoValido()).toBe(false);
    dialogo.monto.set('1.234');
    expect(dialogo.montoValido()).toBe(false);
    dialogo.monto.set('0.01');
    dialogo.motivo.set('Retiro');
    expect(dialogo.montoValido()).toBe(true);
    expect(dialogo.motivoValido()).toBe(true);

    // Una caja cuyo turno dejó de estar abierto no habilita el segundo paso.
    dialogo.cajaId.set('c1');
    client.setQueryData(cajasQueryKey({ estado: 'todas' }), [cajas[1]]);
    await vi.waitFor(() => expect(dialogo.seleccion()).toBeUndefined());
    dialogo.continuar();
    expect(dialogo.paso()).toBe(1);
  });
});
