import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PuntoVentaHeader } from './punto-venta-header';

describe('PuntoVentaHeader', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuntoVentaHeader],
    }).compileComponents();
  });

  it('debe mostrar el título Punto de venta', () => {
    const fixture = TestBed.createComponent(PuntoVentaHeader);
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('#punto-venta-titulo');

    expect(titulo).not.toBeNull();
    expect(titulo.tagName).toBe('H1');
    expect(titulo.textContent.trim()).toBe('Punto de venta');
  });

  it('debe mostrar la descripción', () => {
    const fixture = TestBed.createComponent(PuntoVentaHeader);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Todo listo para atender, cobrar y entregar tu ticket.',
    );
  });
});
