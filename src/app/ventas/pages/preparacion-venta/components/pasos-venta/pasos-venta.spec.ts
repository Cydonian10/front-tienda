import { TestBed } from '@angular/core/testing';
import { PasosVenta } from './pasos-venta';

describe('PasosVenta', () => {
  it('muestra el título de la guía', () => {
    const fixture = TestBed.createComponent(PasosVenta);
    fixture.detectChanges();

    const titulo: HTMLHeadingElement | null = fixture.nativeElement.querySelector('#pasos-titulo');
    expect(titulo?.tagName).toBe('H2');
    expect(titulo?.textContent?.trim()).toBe('Tu venta, paso a paso');
  });

  it('muestra los tres pasos en orden con sus descripciones', () => {
    const fixture = TestBed.createComponent(PasosVenta);
    fixture.detectChanges();

    const pasos: NodeListOf<HTMLLIElement> = fixture.nativeElement.querySelectorAll('ol > li');
    const esperados = [
      ['01', 'Elige los productos', 'Selecciona variante, unidad y cantidad.'],
      ['02', 'Revisa el cobro', 'Consulta las opciones de pago de ejemplo.'],
      ['03', 'Consulta el ticket', 'Conoce cómo se vería el comprobante.'],
    ];

    expect(pasos.length).toBe(esperados.length);
    esperados.forEach(([numero, titulo, descripcion], indice) => {
      expect(pasos[indice].querySelector('span')?.textContent?.trim()).toBe(numero);
      expect(pasos[indice].querySelector('strong')?.textContent?.trim()).toBe(titulo);
      expect(pasos[indice].querySelector('p')?.textContent?.trim()).toBe(descripcion);
    });
  });
});
