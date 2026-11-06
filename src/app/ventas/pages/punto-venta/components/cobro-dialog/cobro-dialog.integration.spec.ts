import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import type { AuthPerfil } from '../../../../../api/interfaces/access-control/auth.interface';
import type { VentaCreada } from '../../../../../api/interfaces/ventas/venta.interface';
import { AuthProfileService } from '../../../../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../../../../auth/services/auth-session.service';
import { AuthStore } from '../../../../../store/auth/auth.store';
import { RegistrarVentaAction } from '../../../../actions/use-registrar-venta-action';
import { PreparacionVentaService } from '../../../../services/preparacion-venta.service';
import { CarritoVentaService } from '../../service/carrito-venta.service';
import { VentaConfirmadaDialog } from '../venta-confirmada-dialog/venta-confirmada-dialog';
import { CobroDialog } from './cobro-dialog';

describe('Integración del cobro con la API', () => {
  it('reintenta el mismo POST tras perder la respuesta y procesa la venta registrada una sola vez', async () => {
    // Conectar el diálogo, la acción real y el cliente HTTP a respuestas controladas.
    const client = new QueryClient();
    const carrito = new CarritoVentaService();
    const unidad = { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' };
    carrito.agregar(
      {
        id: 'v1',
        productoId: 'p1',
        nombre: 'Martillo',
        marca: '',
        sku: 'SKU',
        precio: '10.00',
        stock: '3',
        atributos: [],
        unidadBase: unidad,
        unidades: [unidad],
      },
      unidad,
      '2',
    );
    const cerrar = vi.fn();
    const abrir = vi.fn();
    TestBed.configureTestingModule({
      imports: [CobroDialog],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTanStackQuery(client),
        { provide: CarritoVentaService, useValue: carrito },
        { provide: DialogRef, useValue: { id: 'cobro', close: cerrar, disableClose: false } },
        { provide: Dialog, useValue: { open: abrir } },
        {
          provide: PreparacionVentaService,
          useValue: { seleccion: () => ({ almacenId: 'a1', turnoId: 't1' }) },
        },
        { provide: AuthSessionService, useValue: { get: () => ({ accessToken: 'token-1' }) } },
        { provide: AuthProfileService, useValue: { load: vi.fn().mockResolvedValue(undefined) } },
      ],
    });
    TestBed.inject(AuthStore).setProfile({ id: 'usuario-1', isSuperAdmin: true } as AuthPerfil);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(CobroDialog);
    fixture.detectChanges();
    fixture.componentInstance.monto.set('25.50');
    client.setQueryData(['ventas', 'catalogo', 'a1', '', 1, 5], { items: [] });
    client.setQueryData(['ventas', 'catalogo', 'a2', '', 1, 5], { items: [] });
    const primerEnvio = fixture.componentInstance.registrarCobro();
    let primeraPeticion!: TestRequest;
    await vi.waitFor(() => {
      primeraPeticion = http.expectOne('http://localhost:3000/api/ventas');
    });
    const clave = primeraPeticion.request.headers.get('Idempotency-Key');
    const cuerpo = primeraPeticion.request.body;

    // Simular que el servidor pudo procesar la venta, pero su respuesta se perdió.
    primeraPeticion.error(new ProgressEvent('error'));
    await primerEnvio;
    fixture.detectChanges();
    expect(TestBed.inject(RegistrarVentaAction).estado().tipo).toBe('incierto');
    expect(carrito.lineas()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('No se sabe si la venta se registró');
    expect(cerrar).not.toHaveBeenCalled();

    // El reintento transmite exactamente la misma clave y el mismo cuerpo.
    const reintento = fixture.componentInstance.reintentar();
    let segundaPeticion!: TestRequest;
    await vi.waitFor(() => {
      segundaPeticion = http.expectOne('http://localhost:3000/api/ventas');
    });
    expect(clave).toBeTruthy();
    expect(segundaPeticion.request.headers.get('Idempotency-Key')).toBe(clave);
    expect(segundaPeticion.request.body).toEqual(cuerpo);
    const venta = { id: 'venta-1', total: '19.00', vuelto: { importe: '6.50' } } as VentaCreada;
    segundaPeticion.flush(venta);
    await reintento;

    // La confirmación usa la respuesta real y solo invalida el catálogo del almacén afectado.
    expect(carrito.lineas()).toHaveLength(0);
    expect(cerrar).toHaveBeenCalledOnce();
    expect(abrir).toHaveBeenCalledWith(
      VentaConfirmadaDialog,
      expect.objectContaining({ data: venta }),
    );
    expect(client.getQueryState(['ventas', 'catalogo', 'a1', '', 1, 5])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['ventas', 'catalogo', 'a2', '', 1, 5])?.isInvalidated).toBe(false);
    const estadoFinal = TestBed.inject(RegistrarVentaAction).estado();
    expect(estadoFinal.tipo).toBe('listo');
    http.verify();
    fixture.destroy();
    client.clear();
  });
});
