import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MovimientoCajaApi } from '../../../api/ventas/movimiento-caja/movimiento-caja-api';
import { RegistrarMovimientoCajaAction } from '../../actions/use-movimientos-caja-action';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import MovimientosCajaPage from './movimientos-caja-page';
import { RegistrarMovimientoDialog } from './components/registrar-movimiento-dialog/registrar-movimiento-dialog';

describe('MovimientosCajaPage', () => {
  it('pagina el historial y cambia el tamaño con el componente compartido', async () => {
    // Preparar resultados suficientes para navegar entre páginas.
    const movimiento = {
      id: 'm1', fecha: '2026-11-07T15:00:00Z', cajaNombre: 'Caja principal', cajaCodigo: 'C001',
      tipo: 'ingreso', importe: '10.00', motivo: 'Fondo', usuarioNombre: 'Gabriel', responsableNombre: 'Ana',
    };
    const listar = vi.fn().mockImplementation(async (filtro) => ({
      data: [movimiento], total: 25, page: filtro.page, limit: filtro.limit,
    }));
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(new QueryClient()),
      { provide: MovimientoCajaApi, useValue: { listar } },
      { provide: RegistrarMovimientoCajaAction, useValue: { bloqueado: signal(false), pendiente: signal(null), error: signal('') } },
      { provide: Dialog, useValue: { open: vi.fn() } },
      { provide: AuthorizationService, useValue: { hasPermission: () => true } },
    ] });
    const fixture = TestBed.createComponent(MovimientosCajaPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.listado.isSuccess()).toBe(true));
    fixture.detectChanges();

    // La navegación solicita otra página sin cambiar las fechas.
    const fechas = fixture.componentInstance.filtro();
    const paginador = fixture.nativeElement.querySelector('app-pagination') as HTMLElement;
    expect(paginador).not.toBeNull();
    expect(paginador.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('1');
    (paginador.querySelector('[aria-label="Página siguiente"]') as HTMLButtonElement).click();
    await vi.waitFor(() => expect(listar).toHaveBeenCalledWith({ ...fechas, page: 2 }));
    await vi.waitFor(() => expect(fixture.componentInstance.listado.data()?.page).toBe(2));
    fixture.detectChanges();

    // Cambiar la cantidad vuelve a la primera página y mantiene el rango.
    const selector = fixture.nativeElement.querySelector('app-pagination select') as HTMLSelectElement;
    selector.value = '10';
    selector.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(listar).toHaveBeenCalledWith({ ...fechas, page: 1, limit: 10 }));
    const filtroActualizado = fixture.componentInstance.filtro();
    expect(filtroActualizado.page).toBe(1);
    fixture.componentInstance.aplicarFiltro();
    expect(fixture.componentInstance.filtro().limit).toBe(10);
  });

  it('inicia con el día de Lima y aplica rangos válidos', () => {
    // El primer filtro usa la fecha local del negocio, no la del navegador.
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        {
          provide: MovimientoCajaApi,
          useValue: { listar: vi.fn().mockResolvedValue({ data: [], total: 0 }) },
        },
        {
          provide: RegistrarMovimientoCajaAction,
          useValue: { bloqueado: signal(false), pendiente: signal(null), error: signal('') },
        },
        { provide: Dialog, useValue: { open: vi.fn() } },
        { provide: AuthorizationService, useValue: { hasPermission: () => true } },
      ],
    });
    const fixture = TestBed.createComponent(MovimientosCajaPage);
    const pagina = fixture.componentInstance;
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    expect(pagina.filtro()).toEqual({ desde: hoy, hasta: hoy, page: 1, limit: 5 });
    pagina.desde.set('2026-11-09');
    pagina.hasta.set('2026-11-07');
    pagina.aplicarFiltro();
    expect(pagina.errorFechas()).toContain('rango');
    expect(pagina.filtro().desde).toBe(hoy);
    pagina.hasta.set('2026-11-10');
    pagina.aplicarFiltro();
    expect(pagina.filtro().desde).toBe('2026-11-09');
    expect(pagina.filtro().hasta).toBe('2026-11-10');
  });

  it('abre el flujo de registro con el permiso de cajas', () => {
    // Preparar la página con permiso y comprobar que el botón abre el diálogo.
    const open = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        {
          provide: MovimientoCajaApi,
          useValue: { listar: vi.fn().mockResolvedValue({ data: [], total: 0 }) },
        },
        {
          provide: RegistrarMovimientoCajaAction,
          useValue: { bloqueado: signal(false), pendiente: signal(null), error: signal('') },
        },
        { provide: Dialog, useValue: { open } },
        { provide: AuthorizationService, useValue: { hasPermission: () => true } },
      ],
    });
    const fixture = TestBed.createComponent(MovimientosCajaPage);
    fixture.detectChanges();
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    boton.click();
    expect(open).toHaveBeenCalledWith(
      RegistrarMovimientoDialog,
      expect.objectContaining({
        ariaModal: true,
        restoreFocus: true,
      }),
    );
  });

  it('no abre el flujo cuando falta el permiso', () => {
    // La acción comprueba el permiso incluso si se invoca directamente.
    const open = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        {
          provide: MovimientoCajaApi,
          useValue: { listar: vi.fn().mockResolvedValue({ data: [], total: 0 }) },
        },
        {
          provide: RegistrarMovimientoCajaAction,
          useValue: { bloqueado: signal(false), pendiente: signal(null), error: signal('') },
        },
        { provide: Dialog, useValue: { open } },
        { provide: AuthorizationService, useValue: { hasPermission: () => false } },
      ],
    });
    const fixture = TestBed.createComponent(MovimientosCajaPage);
    fixture.detectChanges();
    fixture.componentInstance.abrirRegistro();
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.disabled).toBe(true);
    expect(open).not.toHaveBeenCalled();
  });
});
