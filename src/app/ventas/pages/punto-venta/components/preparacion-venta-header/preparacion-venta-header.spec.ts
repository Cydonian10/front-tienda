import { TestBed } from '@angular/core/testing';
import { PreparacionVentaHeader } from './preparacion-venta-header';

describe('PreparacionVentaHeader', () => {
  it('muestra el paso, el título y la descripción', () => {
    const fixture = TestBed.createComponent(PreparacionVentaHeader);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('PASO 1 DE 2');
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Prepara tu punto de venta');
    expect(element.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Selecciona el almacén de donde salen los productos y el turno de caja donde se registrarían los cobros.',
    );
    expect(element.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });
});
