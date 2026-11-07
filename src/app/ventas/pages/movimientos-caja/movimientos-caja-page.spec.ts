import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import MovimientosCajaPage from './movimientos-caja-page';
import { RegistrarMovimientoDialog } from './components/registrar-movimiento-dialog/registrar-movimiento-dialog';

describe('MovimientosCajaPage', () => {
  it('abre el flujo de registro con el permiso de cajas', () => {
    // Preparar la página con permiso y comprobar que el botón abre el diálogo.
    const open = vi.fn();
    TestBed.configureTestingModule({ providers: [
      { provide: Dialog, useValue: { open } },
      { provide: AuthorizationService, useValue: { hasPermission: () => true } },
    ] });
    const fixture = TestBed.createComponent(MovimientosCajaPage);
    fixture.detectChanges();
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    boton.click();
    expect(open).toHaveBeenCalledWith(RegistrarMovimientoDialog, expect.objectContaining({
      ariaModal: true,
      restoreFocus: true,
    }));
  });

  it('no abre el flujo cuando falta el permiso', () => {
    // La acción comprueba el permiso incluso si se invoca directamente.
    const open = vi.fn();
    TestBed.configureTestingModule({ providers: [
      { provide: Dialog, useValue: { open } },
      { provide: AuthorizationService, useValue: { hasPermission: () => false } },
    ] });
    const fixture = TestBed.createComponent(MovimientosCajaPage);
    fixture.detectChanges();
    fixture.componentInstance.abrirRegistro();
    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.disabled).toBe(true);
    expect(open).not.toHaveBeenCalled();
  });
});
