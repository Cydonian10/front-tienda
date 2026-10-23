import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import HistorialPage from './historial-page';

describe('HistorialPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  afterEach(() => {
    delete document.documentElement.dataset['theme'];
    TestBed.resetTestingModule();
  });

  function mostrar() {
    const fixture = TestBed.createComponent(HistorialPage);
    fixture.detectChanges();
    return fixture;
  }

  it('presenta la advertencia y los 10 movimientos confirmados en orden descendente', () => {
    const fixture = mostrar();
    const element = fixture.nativeElement as HTMLElement;
    const filas = element.querySelectorAll('table tbody tr');

    expect(element.querySelector('[role="note"]')?.textContent).toContain('Datos de demostración');
    expect(filas).toHaveLength(10);
    expect(filas[0]?.textContent).toContain('MOV-2026-010');
    expect(filas[9]?.textContent).toContain('MOV-2026-001');
    expect(element.textContent).toContain('10 resultados');
    expect(element.querySelector('#historial-busqueda')).toBeTruthy();
    expect(element.querySelector('#historial-tipo')).toBeTruthy();
    expect(element.querySelector('[id*="historial-estado"]')).toBeNull();
    expect(element.querySelector('table tbody a')?.getAttribute('href')).toBe(
      '/admin/inventario/historial/MOV-2026-010',
    );
  });

  it('combina búsqueda y filtro de tipo y permite restablecerlos desde el estado vacío', () => {
    const fixture = mostrar();
    const element = fixture.nativeElement as HTMLElement;
    const busqueda = element.querySelector<HTMLInputElement>('#historial-busqueda')!;
    const tipo = element.querySelector<HTMLSelectElement>('#historial-tipo')!;

    busqueda.value = 'taladro';
    busqueda.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('table tbody tr')).toHaveLength(2);

    tipo.value = 'ingreso';
    tipo.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelectorAll('table tbody tr')).toHaveLength(1);
    expect(element.querySelector('table tbody')?.textContent).toContain('MOV-2026-003');

    tipo.value = 'ajuste';
    tipo.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelector('table')).toBeNull();
    expect(element.textContent).toContain('No hay movimientos de ejemplo');

    const limpiar = [...element.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Limpiar filtros'),
    );
    limpiar?.click();
    fixture.detectChanges();
    expect(busqueda.value).toBe('');
    expect(tipo.value).toBe('todos');
    expect(element.querySelectorAll('table tbody tr')).toHaveLength(10);
  });

  it('muestra tarjetas para móvil con la misma cantidad de movimientos y campos esenciales', () => {
    const fixture = mostrar();
    const element = fixture.nativeElement as HTMLElement;
    const tarjetas = element.querySelectorAll('ul[aria-label="Movimientos de ejemplo"] li');

    expect(tarjetas).toHaveLength(10);
    expect(tarjetas[0]?.textContent).toContain('Traslado');
    expect(tarjetas[0]?.textContent).toContain('Almacén principal → Sucursal norte');
    expect(tarjetas[0]?.textContent).toContain('S/ 154.00');
    expect(element.querySelector('ul[aria-label="Movimientos de ejemplo"]')?.className).toContain(
      'md:hidden',
    );
    expect(element.querySelector('table')?.parentElement?.className).toContain('md:block');
    expect(element.querySelector('table')?.parentElement?.className).toContain('overflow-x-auto');
    expect(element.querySelector('section.card.min-w-0')).toBeTruthy();
  });

  it('expone controles nativos etiquetados, enlaces identificables y superficies ligadas al tema', () => {
    const fixture = mostrar();
    const element = fixture.nativeElement as HTMLElement;
    const campo = element.querySelector<HTMLInputElement>('#historial-busqueda')!;
    const selector = element.querySelector<HTMLSelectElement>('#historial-tipo')!;

    for (const tema of ['ferreteria', 'light']) {
      document.documentElement.dataset['theme'] = tema;
      fixture.detectChanges();
      expect(element.querySelector('label[for="historial-busqueda"]')).toBeTruthy();
      expect(element.querySelector('label[for="historial-tipo"]')).toBeTruthy();
      expect(element.querySelectorAll('.bg-base-100').length).toBeGreaterThan(0);
      expect(
        [...element.querySelectorAll('[class]')].some((node) =>
          node.classList.contains('text-base-content/70'),
        ),
      ).toBe(true);
      expect(element.querySelector('a[aria-label="Ver detalle de MOV-2026-010"]')).toBeTruthy();
      expect(element.querySelector('[role="note"]')?.textContent).toContain(
        'Datos de demostración',
      );
    }
    campo.focus();
    expect(document.activeElement).toBe(campo);
    selector.focus();
    expect(document.activeElement).toBe(selector);
  });
});
