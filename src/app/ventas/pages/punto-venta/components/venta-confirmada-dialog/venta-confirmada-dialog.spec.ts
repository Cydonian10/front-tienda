import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { VentaConfirmadaDialog } from './venta-confirmada-dialog';

describe('VentaConfirmadaDialog', () => {
  it('muestra el total y el vuelto reales hasta que se cierre', () => {
    // Preparar una respuesta con un total y un vuelto distintos de los previstos.
    const cerrar = vi.fn();
    TestBed.configureTestingModule({
      imports: [VentaConfirmadaDialog],
      providers: [
        { provide: DialogRef, useValue: { id: 'confirmacion', close: cerrar } },
        { provide: DIALOG_DATA, useValue: { total: '19.00', vuelto: { importe: '6.50' } } },
      ],
    });
    const fixture = TestBed.createComponent(VentaConfirmadaDialog);
    fixture.detectChanges();
    const dialogo = fixture.nativeElement as HTMLElement;
    expect(dialogo.querySelector('#confirmacion-title')?.textContent).toBe('Venta registrada');
    expect(dialogo.textContent).toContain('S/ 19.00');
    expect(dialogo.textContent).toContain('S/ 6.50');
    expect(cerrar).not.toHaveBeenCalled();

    // La confirmación se cierra mediante su botón.
    dialogo.querySelector<HTMLButtonElement>('button')!.click();
    expect(cerrar).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('muestra cero cuando la venta no tiene vuelto', () => {
    // La API devuelve null cuando no existe vuelto.
    TestBed.configureTestingModule({
      imports: [VentaConfirmadaDialog],
      providers: [
        { provide: DialogRef, useValue: { id: 'confirmacion', close: vi.fn() } },
        { provide: DIALOG_DATA, useValue: { total: '20.00', vuelto: null } },
      ],
    });
    const fixture = TestBed.createComponent(VentaConfirmadaDialog);
    fixture.detectChanges();
    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('S/ 0.00');
    fixture.destroy();
  });
});
