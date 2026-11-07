import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { VentaApi } from '../../../../../api/ventas/venta/venta-api';
import { AuthorizationService } from '../../../../../auth/services/authorization.service';
import { VentaConfirmadaDialog } from './venta-confirmada-dialog';

describe('VentaConfirmadaDialog', () => {
  const datos = {
    id: 'venta-1',
    fecha: '2026-11-07T15:14:00Z',
    caja: 'Principal',
    turnoId: 'turno-1',
    almacen: 'Almacén principal',
    atendidoPor: 'Gabriel',
    subtotal: '20.00',
    descuentoPromocional: '1.00',
    descuentoManual: '0.00',
    total: '19.00',
    detalles: [
      {
        id: 'detalle-1',
        producto: 'Martillo',
        sku: 'M-01',
        unidad: 'Unidad',
        cantidad: '2.000000',
        precioUnitario: '10.00',
        descuentoPromocional: '1.00',
        descuentoManual: '0.00',
        total: '19.00',
      },
    ],
    pagos: [{ medio: 'efectivo', importe: '25.50' }],
    vuelto: '6.50',
  };
  let client: QueryClient;
  const cerrar = vi.fn();
  const ticket = vi.fn();
  const ticketPdf = vi.fn();
  const tienePermiso = vi.fn();

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    cerrar.mockReset();
    ticket.mockReset().mockResolvedValue(datos);
    ticketPdf.mockReset();
    tienePermiso.mockReset().mockReturnValue(true);
    TestBed.configureTestingModule({
      imports: [VentaConfirmadaDialog],
      providers: [
        provideTanStackQuery(client),
        { provide: DialogRef, useValue: { id: 'confirmacion', close: cerrar } },
        { provide: DIALOG_DATA, useValue: { id: 'venta-1' } },
        { provide: VentaApi, useValue: { ticket, ticketPdf } },
        { provide: AuthorizationService, useValue: { hasPermission: tienePermiso } },
      ],
    });
  });

  afterEach(() => {
    client.clear();
    vi.restoreAllMocks();
  });

  it('muestra el ticket registrado y permite iniciar una nueva venta', async () => {
    // Consultar los datos confirmados, no los importes previstos del carrito.
    const fixture = TestBed.createComponent(VentaConfirmadaDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Martillo');
    });
    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('S/ 19.00');
    expect(contenido).toContain('S/ 6.50');
    expect(contenido).toContain('2 × Unidad');
    expect(ticket).toHaveBeenCalledWith('venta-1');
    const boton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((elemento) => elemento.textContent?.includes('Nueva venta'));
    boton!.click();
    expect(cerrar).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('permite reintentar la consulta sin volver a cobrar', async () => {
    ticket.mockRejectedValueOnce(new Error('sin conexión'));
    const fixture = TestBed.createComponent(VentaConfirmadaDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('La venta ya está registrada');
    });
    fixture.nativeElement.querySelector('button').click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Martillo');
    });
    expect(ticket).toHaveBeenCalledTimes(2);
    expect(ticketPdf).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('notifica el error del PDF y conserva el ticket', async () => {
    const ventana = { close: vi.fn(), location: { href: '' } };
    vi.spyOn(window, 'open').mockReturnValue(ventana as unknown as Window);
    ticketPdf.mockRejectedValue(new Error('sin conexión'));
    const fixture = TestBed.createComponent(VentaConfirmadaDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.componentInstance.ticket.data()).toBeTruthy();
    });
    await fixture.componentInstance.imprimir();
    fixture.detectChanges();
    expect(ventana.close).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('La venta ya está registrada');
    expect(fixture.nativeElement.textContent).toContain('Martillo');
    expect(ticketPdf).toHaveBeenCalledWith('venta-1');
    fixture.destroy();
  });

  it('abre el PDF obtenido para imprimir sin registrar otra venta', async () => {
    const ventana = { close: vi.fn(), location: { href: '' } };
    vi.spyOn(window, 'open').mockReturnValue(ventana as unknown as Window);
    const crearUrl = vi.fn().mockReturnValue('blob:ticket');
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: crearUrl, revokeObjectURL: vi.fn() }),
    );
    const pdf = new Blob(['pdf'], { type: 'application/pdf' });
    ticketPdf.mockResolvedValue(pdf);
    const fixture = TestBed.createComponent(VentaConfirmadaDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.componentInstance.ticket.data()).toBeTruthy();
    });
    await fixture.componentInstance.imprimir();
    expect(ticketPdf).toHaveBeenCalledOnce();
    expect(crearUrl).toHaveBeenCalledWith(pdf);
    expect(ventana.location.href).toBe('blob:ticket');
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('no solicita un PDF si se perdió el permiso', async () => {
    tienePermiso.mockReturnValue(false);
    const fixture = TestBed.createComponent(VentaConfirmadaDialog);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.componentInstance.ticket.data()).toBeTruthy();
    });
    await fixture.componentInstance.imprimir();
    expect(ticketPdf).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
