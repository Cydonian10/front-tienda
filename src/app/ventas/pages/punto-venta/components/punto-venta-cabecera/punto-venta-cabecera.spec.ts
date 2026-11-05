import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PuntoVentaCabecera } from './punto-venta-cabecera';

describe('PuntoVentaCabecera', () => {
  it('muestra la cabecera y los datos de ejemplo', async () => {
    // Renderizar la cabecera visual.
    await TestBed.configureTestingModule({ imports: [PuntoVentaCabecera] }).compileComponents();
    const fixture = TestBed.createComponent(PuntoVentaCabecera);
    fixture.detectChanges();

    // Comprobar el contexto de venta y sus acciones aún no disponibles.
    const contenido = fixture.nativeElement.textContent as string;
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    expect(contenido).toContain('Nueva venta');
    expect(contenido).toContain('Almacén principal');
    expect(contenido).toContain('Caja principal · #01');
    expect(contenido).toContain('Gabriel');
    expect(contenido).toContain('Datos de ejemplo');
    expect(botones).toHaveLength(2);
    expect(botones.every((boton) => boton.disabled)).toBe(true);
  });
});
