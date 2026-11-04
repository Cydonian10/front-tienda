import { TestBed } from '@angular/core/testing';
import PuntoVentaPage from './punto-venta-page';

describe('PuntoVentaPage', () => {
  it('comunica la preparación y la selección de un ticket a la página', () => {
    const fixture = TestBed.createComponent(PuntoVentaPage);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const almacen = element.querySelector<HTMLSelectElement>('#almacen')!;
    const turno = element.querySelector<HTMLSelectElement>('#turno')!;
    const continuar = element.querySelector<HTMLButtonElement>('.btn-primary')!;
    expect(continuar.disabled).toBe(true);
    almacen.value = 'Almacén principal';
    almacen.dispatchEvent(new Event('change'));
    turno.value = 'Caja principal';
    turno.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(continuar.disabled).toBe(false);
    continuar.click();
    expect(fixture.componentInstance.vista()).toBe('venta');
    element.querySelector<HTMLButtonElement>('app-ventas-recientes button')!.click();
    expect(fixture.componentInstance.ticketReciente()).toBe(true);
    expect(fixture.componentInstance.vista()).toBe('ticket');
  });
});
