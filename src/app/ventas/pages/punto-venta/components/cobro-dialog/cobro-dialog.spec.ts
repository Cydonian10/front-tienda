import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { EMPTY } from 'rxjs';
import type { AuthPerfil } from '../../../../../api/interfaces/access-control/auth.interface';
import type { VentaCreada } from '../../../../../api/interfaces/ventas/venta.interface';
import { AuthStore } from '../../../../../store/auth/auth.store';
import {
  RegistrarVentaAction,
  type EstadoRegistroVenta,
} from '../../../../actions/use-registrar-venta-action';
import { PreparacionVentaService } from '../../../../services/preparacion-venta.service';
import { CarritoVentaService } from '../../service/carrito-venta.service';
import { VentaConfirmadaDialog } from '../venta-confirmada-dialog/venta-confirmada-dialog';
import { CobroDialog } from './cobro-dialog';

describe('CobroDialog', () => {
  const unidad = { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' };
  const variante = {
    id: 'v1',
    productoId: 'p1',
    nombre: 'Martillo',
    marca: 'Stanley',
    sku: 'MAR',
    precio: '10.00',
    stock: '3',
    atributos: [],
    unidadBase: unidad,
    unidades: [unidad],
  };
  const venta = { id: 'venta-1', total: '19.00', vuelto: { importe: '6.50' } } as VentaCreada;

  function preparar() {
    const carrito = new CarritoVentaService();
    carrito.agregar(variante, unidad, '2');
    const estado = signal<EstadoRegistroVenta>({ tipo: 'listo' });
    const registrar = vi.fn().mockResolvedValue(undefined);
    const reintentar = vi.fn().mockResolvedValue(undefined);
    const consumirConfirmacion = vi.fn(() => estado.set({ tipo: 'listo' }));
    const seleccion = signal<{ almacenId: string; turnoId: string } | null>({
      almacenId: 'a1',
      turnoId: 't1',
    });
    const recuperarTurno = vi.fn();
    const finalizarRecuperacion = vi.fn();
    const dialogRef = { id: 'cobro-prueba', close: vi.fn(), disableClose: false };
    const abrirDialogo = vi.fn();
    const navegar = vi.fn().mockResolvedValue(true);
    const client = new QueryClient();
    const invalidar = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [CobroDialog],
      providers: [
        { provide: CarritoVentaService, useValue: carrito },
        { provide: DialogRef, useValue: dialogRef },
        { provide: Dialog, useValue: { open: abrirDialogo } },
        {
          provide: Router,
          useValue: { navigate: navegar, currentNavigation: () => null, events: EMPTY },
        },
        { provide: QueryClient, useValue: client },
        {
          provide: PreparacionVentaService,
          useValue: { seleccion, recuperarTurno, finalizarRecuperacion },
        },
        {
          provide: RegistrarVentaAction,
          useValue: {
            estado,
            registrar,
            reintentar,
            consumirConfirmacion,
            bloqueado: computed(() =>
              ['verificando', 'enviando', 'incierto', 'revision'].includes(estado().tipo),
            ),
          },
        },
      ],
    });
    const auth = TestBed.inject(AuthStore);
    auth.setProfile({ id: 'usuario-1', isSuperAdmin: true } as AuthPerfil);
    const fixture = TestBed.createComponent(CobroDialog);
    fixture.detectChanges();
    const dialogo = fixture.nativeElement as HTMLElement;
    return {
      carrito,
      estado,
      registrar,
      reintentar,
      seleccion,
      recuperarTurno,
      dialogRef,
      abrirDialogo,
      navegar,
      invalidar,
      auth,
      fixture,
      dialogo,
    };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('valida efectivo y Yape, calcula el vuelto y conserva los montos rápidos', () => {
    // Preparar el diálogo con un total de veinte soles.
    const { fixture, dialogo } = preparar();
    const monto = dialogo.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;
    const boton = () =>
      Array.from(dialogo.querySelectorAll('button')).find((item) =>
        item.textContent?.includes('Registrar cobro'),
      )!;

    // El efectivo debe ser positivo y cubrir el total.
    monto.value = '19.99';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const errorEfectivo = dialogo.querySelector('[role="alert"]');
    expect(errorEfectivo?.textContent).toContain('El monto recibido debe cubrir el total.');
    expect(monto.getAttribute('aria-describedby')).toBe(errorEfectivo?.id);
    expect(boton().disabled).toBe(true);
    monto.value = '25.50';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(dialogo.textContent).toContain('S/ 5.50');
    expect(boton().disabled).toBe(false);

    // Los montos rápidos y la selección de Yape conservan las reglas existentes.
    const botonesRapidos = dialogo.querySelectorAll<HTMLButtonElement>(
      '[aria-label="Montos rápidos de efectivo"] button',
    );
    botonesRapidos[2].click();
    fixture.detectChanges();
    expect(monto.value).toBe('50');
    botonesRapidos[0].click();
    fixture.detectChanges();
    expect(monto.value).toBe('20.00');
    dialogo.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();
    fixture.detectChanges();
    expect(monto.value).toBe('20.00');
    expect(dialogo.textContent).not.toContain('Vuelto');
    monto.value = '20.01';
    monto.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(dialogo.textContent).toContain('El monto de Yape debe ser igual al total.');
    expect(boton().disabled).toBe(true);
    fixture.destroy();
  });

  it('envía solo el contrato válido y confirma con los importes registrados', async () => {
    // Registrar efectivo y simular que la API confirma otro total y vuelto.
    const { fixture, carrito, estado, registrar, invalidar, dialogRef, abrirDialogo } = preparar();
    registrar.mockImplementation(async () => estado.set({ tipo: 'confirmado', venta }));
    fixture.componentInstance.monto.set('25.50');
    await fixture.componentInstance.registrarCobro();

    // El carrito se vacía y se abre la confirmación con la respuesta real.
    expect(registrar).toHaveBeenCalledWith({
      turnoId: 't1',
      almacenId: 'a1',
      detalles: [{ varianteId: 'v1', unidadId: 'u1', cantidad: '2' }],
      pagos: [{ medio: 'efectivo', importe: '25.50' }],
    });
    expect(carrito.lineas()).toHaveLength(0);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['ventas', 'catalogo', 'a1'] });
    expect(dialogRef.close).toHaveBeenCalledOnce();
    expect(abrirDialogo).toHaveBeenCalledWith(
      VentaConfirmadaDialog,
      expect.objectContaining({ data: venta, disableClose: true }),
    );
    fixture.destroy();
  });

  it('registra Yape con el importe exacto como único pago', async () => {
    // Seleccionar Yape llena automáticamente el importe total.
    const { fixture, registrar } = preparar();
    fixture.componentInstance.seleccionarMedio('yape');
    await fixture.componentInstance.registrarCobro();
    const solicitudEnviada = registrar.mock.calls[0][0];
    expect(solicitudEnviada.pagos).toEqual([{ medio: 'yape', importe: '20.00' }]);
    fixture.destroy();
  });

  it('no envía con selección ausente, total cero, importe inválido o permiso revocado', async () => {
    // Revalidar incluso cuando se invoque el método sin pulsar el botón.
    const { fixture, registrar, seleccion, carrito, auth } = preparar();
    fixture.componentInstance.monto.set('20.00');
    seleccion.set(null);
    await fixture.componentInstance.registrarCobro();
    seleccion.set({ almacenId: 'a1', turnoId: 't1' });
    fixture.componentInstance.monto.set('0');
    await fixture.componentInstance.registrarCobro();
    fixture.componentInstance.monto.set('20.00');
    auth.clear();
    await fixture.componentInstance.registrarCobro();
    auth.setProfile({ id: 'usuario-1', isSuperAdmin: true } as AuthPerfil);
    carrito.vaciar();
    await fixture.componentInstance.registrarCobro();
    expect(registrar).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('bloquea edición y cierre ante un resultado incierto y permite reintentar', async () => {
    // Simular una respuesta perdida con una solicitud ya enviada.
    const { fixture, estado, reintentar, dialogRef, dialogo } = preparar();
    const intento = {
      dto: {
        turnoId: 't1',
        almacenId: 'a1',
        detalles: [],
        pagos: [{ medio: 'efectivo' as const, importe: '20.00' }] as const,
      },
      clave: 'clave-1',
      usuarioId: 'usuario-1',
    };
    estado.set({ tipo: 'incierto', intento, error: new HttpErrorResponse({ status: 0 }) });
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(dialogo.querySelector<HTMLInputElement>('input[inputmode="decimal"]')?.disabled).toBe(
      true,
    );
    expect(dialogo.textContent).toContain('No se sabe si la venta se registró');
    expect(dialogo.textContent).toContain('perderás la recuperación');

    // El reintento se delega a la acción que conserva clave y cuerpo.
    await fixture.componentInstance.reintentar();
    expect(reintentar).toHaveBeenCalledOnce();
    expect(dialogRef.disableClose).toBe(true);
    fixture.destroy();
  });

  it('conserva el carrito y actualiza el catálogo cuando falta stock', async () => {
    // El rechazo de la API no debe eliminar ninguna línea.
    const { fixture, carrito, estado, registrar, invalidar, dialogRef } = preparar();
    registrar.mockImplementation(async () =>
      estado.set({
        tipo: 'rechazado',
        error: new HttpErrorResponse({ status: 409, error: { message: 'Stock insuficiente' } }),
      }),
    );
    fixture.componentInstance.monto.set('20');
    await fixture.componentInstance.registrarCobro();
    fixture.detectChanges();
    expect(carrito.lineas()).toHaveLength(1);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['ventas', 'catalogo', 'a1'] });
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Stock insuficiente');
    fixture.destroy();
  });

  it('ofrece seleccionar otro turno si el turno está cerrado', async () => {
    // Un rechazo por turno cerrado conserva la venta para preparación.
    const { fixture, estado, recuperarTurno, navegar, carrito } = preparar();
    estado.set({
      tipo: 'rechazado',
      error: new HttpErrorResponse({ status: 409, error: { message: 'El turno está cerrado' } }),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Elegir otro turno');
    await fixture.componentInstance.cambiarTurno();
    expect(recuperarTurno).toHaveBeenCalledOnce();
    expect(navegar).toHaveBeenCalledWith(['/admin/ventas/preparacion']);
    expect(carrito.lineas()).toHaveLength(1);
    fixture.destroy();
  });
});
