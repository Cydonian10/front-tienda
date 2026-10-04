import { TestBed } from '@angular/core/testing';
import RolesPage from './roles.page';

describe('RolesPage static mockup', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders example systems and roles without API providers', () => {
    const fixture = TestBed.createComponent(RolesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Sistemas y roles');
    expect(element.textContent).toContain('Inventario');
    expect(element.textContent).toContain('Supervisor de inventario');
    expect(element.textContent).toContain('INVENTARIO_SUPERVISOR');
    expect(element.textContent).toContain('Permisos del rol');
    expect(element.textContent).toContain('Consultar productos');
    expect(element.textContent).toContain('Vista de demostración');
  });

  it('keeps mockup controls visibly disabled', () => {
    const fixture = TestBed.createComponent(RolesPage);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('button:disabled').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('input:disabled').length).toBe(7);
  });
});
