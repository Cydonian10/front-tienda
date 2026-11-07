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
    expect(pagina.filtro()).toEqual({ desde: hoy, hasta: hoy, page: 1, limit: 20 });
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
