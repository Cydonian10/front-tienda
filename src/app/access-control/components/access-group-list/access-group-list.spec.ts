import { TestBed } from '@angular/core/testing';
import { AccessGroupList } from './access-group-list';
import { type Permiso } from '../../../api/interfaces/access-control/permision.interface';

describe('AccessGroupList', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('usa IDs de la API, emite solo el grupo y respeta bloqueo y catálogo incompleto', () => {
    const permissions: Permiso[] = [
      {
        id: 'stock-id',
        code: 'EXISTENCIAS_LEER',
        name: 'Leer existencias',
        resourceCode: 'EXISTENCIAS',
        actionCode: 'LEER',
        systemCode: 'INVENTARIO',
        systemName: 'Inventario',
        systemId: 'inventory',
      },
    ];
    const fixture = TestBed.createComponent(AccessGroupList);
    fixture.componentRef.setInput('systemCode', 'INVENTARIO');
    fixture.componentRef.setInput('permissions', permissions);
    fixture.detectChanges();
    const changes = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(changes);
    (fixture.nativeElement.querySelector('#access-group-stock-read') as HTMLInputElement).click();
    expect(changes).toHaveBeenCalledWith({ ids: ['stock-id'], assigned: true });
    expect(fixture.componentInstance.selectedIds().size).toBe(0);
    expect(fixture.nativeElement.querySelector('#access-group-catalog-manage').disabled).toBe(true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    fixture.componentInstance.toggle(
      fixture.componentInstance.groups().find((group) => group.id === 'stock-read')!,
    );
    expect(changes).toHaveBeenCalledTimes(1);
  });
});
