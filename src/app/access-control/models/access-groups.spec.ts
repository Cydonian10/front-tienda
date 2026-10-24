import { ACCESS_GROUPS, accessGroupStates } from './access-groups';
import { type Permiso } from '../../api/interfaces/access-control/permision.interface';

function catalog(): Permiso[] {
  return [
    ...new Set(
      ACCESS_GROUPS.filter((group) => group.systemCode === 'INVENTARIO').flatMap(
        (group) => group.codes,
      ),
    ),
  ].map((code) => ({
    id: `id-${code}`,
    code,
    name: code,
    resourceCode: code.split('_')[0],
    actionCode: '',
    systemCode: 'INVENTARIO',
    systemId: 'inventory',
    systemName: 'Inventario',
  }));
}

describe('Access groups', () => {
  it('define identidades únicas sin permisos duplicados dentro de un grupo', () => {
    expect(new Set(ACCESS_GROUPS.map((group) => group.id)).size).toBe(ACCESS_GROUPS.length);
    for (const group of ACCESS_GROUPS) expect(new Set(group.codes).size).toBe(group.codes.length);
  });

  it('distingue sin acceso, parcial y completo sin cambiar asignaciones', () => {
    const permissions = catalog();
    const selection = new Set(['id-PRODUCTOS_LEER']);
    const states = accessGroupStates(permissions, selection, 'INVENTARIO');
    expect(states.find((group) => group.id === 'catalog-read')).toMatchObject({
      partial: true,
      checked: false,
      available: true,
    });
    expect(selection.size).toBe(1);
    const full = new Set(states.find((group) => group.id === 'catalog-read')!.ids);
    expect(
      accessGroupStates(permissions, full, 'INVENTARIO').find(
        (group) => group.id === 'catalog-read',
      )?.checked,
    ).toBe(true);
    expect(states.find((group) => group.id === 'stock-read')?.partial).toBe(false);
  });

  it('no confunde el mismo código en otro sistema ni concede grupos incompletos', () => {
    const permissions = catalog().map((permission) => ({
      ...permission,
      systemCode: 'ACCESS_CONTROL',
    }));
    expect(
      accessGroupStates(permissions, new Set(), 'INVENTARIO').every(
        (group) => !group.available && !group.ids.length,
      ),
    ).toBe(true);
  });

  it('gestionar catálogo no incluye operaciones de existencias o administración', () => {
    const group = ACCESS_GROUPS.find((item) => item.id === 'catalog-manage')!;
    expect(group.codes).toContain('PRODUCTOS_LEER');
    expect(group.codes).toContain('PRODUCTOS_EDITAR');
    expect(group.codes).not.toContain('AJUSTES_CREAR');
    expect(group.codes).not.toContain('USUARIOS_ASIGNAR_ROL');
  });
});
