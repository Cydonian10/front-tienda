import { TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders one accessible loading message and three decorative text lines', () => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role=status]')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.sr-only').textContent).toBe('Cargando contenido…');
    expect(fixture.nativeElement.querySelector('[aria-hidden=true]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.skeleton')).toHaveLength(3);
  });

  it.each(['text', 'list', 'cards'] as const)('reacts to %s variant and count changes', (variant) => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.componentRef.setInput('variant', variant);
    fixture.componentRef.setInput('count', 2);
    fixture.componentRef.setInput('label', 'Cargando productos');
    fixture.detectChanges();
    const perItem = { text: 1, list: 4, cards: 4 };
    expect(fixture.nativeElement.querySelectorAll('.skeleton')).toHaveLength(2 * perItem[variant]);
    expect(fixture.nativeElement.querySelector('.sr-only').textContent).toBe('Cargando productos');
    fixture.componentRef.setInput('count', 4);
    fixture.detectChanges();
    expect(fixture.componentInstance.items()).toHaveLength(4);
  });

  it.each([[0, 1], [-2, 1], [2.9, 2], [100, 20], [NaN, 3], [Infinity, 3]])('bounds count %s to %s', (value, expected) => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.componentRef.setInput('count', value);
    fixture.detectChanges();
    expect(fixture.componentInstance.items()).toHaveLength(expected);
  });

  it('can disable animation and has responsive card columns', () => {
    const fixture = TestBed.createComponent(Skeleton);
    fixture.componentRef.setInput('animated', false);
    fixture.componentRef.setInput('variant', 'cards');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.is-static')).not.toBeNull();
    const grid = fixture.nativeElement.querySelector('.grid') as HTMLElement;
    expect(grid.classList.contains('grid-cols-1')).toBe(true);
    expect(grid.classList.contains('sm:grid-cols-2')).toBe(true);
    expect(grid.classList.contains('lg:grid-cols-3')).toBe(true);
  });
});
