import { TestBed } from '@angular/core/testing';
import { VentasRecientes } from './ventas-recientes';

describe('VentasRecientes', () => {
  it('muestra un mensaje cuando no hay ventas', () => {
    const fixture = TestBed.createComponent(VentasRecientes);
    fixture.componentRef.setInput('ventas', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay ventas recientes');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('muestra las ventas y emite la seleccionada', () => {
    const fixture = TestBed.createComponent(VentasRecientes);
    const ventas = [
      { id: 'V-0001', caja: 'Caja principal', total: 60.8 },
      { id: 'V-0002', caja: 'Caja secundaria', total: 15 },
    ];
    fixture.componentRef.setInput('ventas', ventas);
    const emitir = vi.fn();
    fixture.componentInstance.verTicket.subscribe(emitir);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('V-0001');
    expect(element.textContent).toContain('Caja secundaria');
    expect(element.textContent).toContain('60.80');
    expect(element.textContent).not.toContain('No hay ventas recientes');
    element.querySelectorAll('button')[1].click();
    expect(emitir).toHaveBeenCalledWith(ventas[1]);
  });
});
