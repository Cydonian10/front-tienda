import { TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, Router } from '@angular/router';
import {
  PendingPermissionsGuard,
  confirmChangingSelection,
  confirmLeavingPage,
} from './guards/pending-permissions.guard';

describe('PendingPermissionsGuard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('confirma al cambiar de paso o ruta si hay cambios pendientes', () => {
    const serializer = new DefaultUrlSerializer();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            url: '/admin/sistemas-roles?step=permisos&roleCode=ADMIN',
            parseUrl: (url: string) => serializer.parse(url),
          },
        },
      ],
    });
    const guard = TestBed.inject(PendingPermissionsGuard);
    let dirty = true;
    const stopWatching = guard.watch(() => dirty);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const changeSelection = (url: string) =>
      TestBed.runInInjectionContext(() => confirmChangingSelection({} as never, { url } as never));
    const leavePage = () =>
      TestBed.runInInjectionContext(() =>
        confirmLeavingPage({} as never, {} as never, {} as never, {} as never),
      );

    expect(changeSelection('/admin/sistemas-roles?step=roles&roleCode=ADMIN')).toBe(false);
    expect(leavePage()).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(changeSelection('/admin/sistemas-roles?step=permisos&roleCode=ADMIN&filter=all')).toBe(
      true,
    );

    confirm.mockReturnValue(true);
    expect(changeSelection('/admin/sistemas-roles?step=roles&roleCode=ADMIN')).toBe(true);
    dirty = false;
    expect(leavePage()).toBe(true);
    stopWatching();
  });
});
