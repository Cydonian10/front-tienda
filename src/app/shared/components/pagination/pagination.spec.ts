import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  function render(page: number, totalPages: number) {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra extremos, vecinas y puntos suspensivos como en la referencia', () => {
    const fixture = render(5, 10);
    expect(fixture.componentInstance.items()).toEqual([
      1,
      'ellipsis-start',
      4,
      5,
      6,
      'ellipsis-end',
      10,
    ]);
    expect(fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent.trim()).toBe(
      '5',
    );
    expect(
      fixture.nativeElement.querySelectorAll(
        'button[aria-label^="Página "]:not([aria-label="Página anterior"]):not([aria-label="Página siguiente"])',
      ).length,
    ).toBe(5);
    fixture.destroy();
  });

  it('evita puntos suspensivos para una sola página oculta y respeta límites', () => {
    const fixture = render(1, 4);
    expect(fixture.componentInstance.items()).toEqual([1, 2, 3, 4]);
    expect(fixture.nativeElement.querySelector('[aria-label="Página anterior"]').disabled).toBe(
      true,
    );
    const selected = vi.fn();
    fixture.componentInstance.pageChange.subscribe(selected);
    fixture.componentInstance.select(2);
    fixture.componentInstance.select(0);
    expect(selected).toHaveBeenCalledExactlyOnceWith(2);
    fixture.destroy();
  });

  it('muestra la página 1 aun cuando sea la única y bloquea interacciones deshabilitadas', () => {
    const fixture = render(1, 1);
    expect(fixture.nativeElement.querySelector('[aria-label="Página 1"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Página anterior"]').disabled).toBe(
      true,
    );
    expect(fixture.nativeElement.querySelector('[aria-label="Página siguiente"]').disabled).toBe(
      true,
    );
    fixture.componentRef.setInput('totalPages', 3);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const selected = vi.fn();
    fixture.componentInstance.pageChange.subscribe(selected);
    fixture.componentInstance.select(2);
    expect(selected).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('ofrece tamaños 5, 10 y 20 y emite la selección', () => {
    const fixture = render(1, 2);
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => Number(option.value))).toEqual([5, 10, 20]);
    const changed = vi.fn();
    fixture.componentInstance.pageSizeChange.subscribe(changed);
    select.value = '10';
    select.dispatchEvent(new Event('change'));
    expect(changed).toHaveBeenCalledWith(10);
    fixture.destroy();
  });
});
