import { Component, computed, inject, signal, viewChild, ElementRef, effect, HostListener } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { PermisosApi } from '../../../api/access-control/permisos-api';
import { RolesApi } from '../../../api/access-control/roles-api';
import { PERMISSION_CODES, Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { SystemRecord } from '../../../api/interfaces/access-control/role.interface';
import { Icon } from '../../../shared/components/icon/icon';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { AuthStore } from '../../../store/auth/auth.store';
import { findSystemsQuery } from '../../actions/systems/find-systems-action';
import { getPermisosQuery, getPermisosQueryKey } from '../../actions/permisos/get-permisos-action';
import { rolesQuery, rolesQueryKey } from '../../actions/roles/roles-actions';

@Component({
  imports: [Icon],
  selector: 'app-roles',
  templateUrl: './roles.page.html',
  host: { class: 'block min-w-0' },
})
export default class RolesPage {
  private readonly toast = inject(ToastService);
  private readonly api = inject(RolesApi);
  private readonly permissionsApi = inject(PermisosApi);
  private readonly queryClient = inject(QueryClient);
  private readonly auth = inject(AuthStore);
  private readonly createDialog = viewChild<ElementRef<HTMLDialogElement>>('createDialog');
  private readonly leaveDialog = viewChild<ElementRef<HTMLDialogElement>>('leaveDialog');
  private leaveResolver?: (choice: 'cancel' | 'discard' | 'save') => void;
  private readonly savedIds = signal<ReadonlySet<string>>(new Set());
  private readonly loadedRoleId = signal<string | null>(null);

  readonly systemsQuery = findSystemsQuery();
  readonly rolesQuery = rolesQuery();
  readonly systemId = signal<string | null>(null);
  readonly roleId = signal<string | null>(null);
  readonly systemSearch = signal('');
  readonly roleSearch = signal('');
  readonly permissionSearch = signal('');
  readonly resourceFilter = signal('all');
  readonly assignmentFilter = signal('all');
  readonly draftIds = signal<ReadonlySet<string>>(new Set());
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly createName = signal('');
  readonly createDescription = signal('');
  readonly createError = signal('');

  readonly systems = computed(() =>
    [...(this.systemsQuery.data() ?? [])].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es')),
  );
  readonly selectedSystem = computed(() =>
    this.systems().find((system) => system.id === this.systemId()) ?? this.systems()[0] ?? null,
  );
  readonly visibleSystems = computed(() =>
    this.systems().filter((system) =>
      `${system.name} ${system.code}`.toLocaleLowerCase().includes(this.systemSearch().toLocaleLowerCase()),
    ),
  );
  readonly systemRoles = computed(() =>
    (this.rolesQuery.data() ?? []).filter((role) => role.systemId === this.selectedSystem()?.id),
  );
  readonly visibleRoles = computed(() =>
    this.systemRoles().filter((role) =>
      `${role.name} ${role.code}`.toLocaleLowerCase().includes(this.roleSearch().toLocaleLowerCase()),
    ),
  );
  readonly selectedRole = computed(() => this.systemRoles().find((role) => role.id === this.roleId()) ?? null);
  readonly canCreate = computed(() => this.hasPermission(PERMISSION_CODES.ROLES_CREATE));
  readonly canAssign = computed(() => this.hasPermission(PERMISSION_CODES.ROLES_ASSIGN_PERMISSION));
  readonly availablePermissions = getPermisosQuery(() => this.selectedSystem()?.code ?? null);
  readonly assignedPermissions = injectQuery(() => ({
    queryKey: [...getPermisosQueryKey, 'role', this.roleId()],
    queryFn: () => this.permissionsApi.findPermisos({ rolId: this.roleId()! }),
    enabled: !!this.roleId(),
    staleTime: 0,
    retry: false,
  }));
  readonly resources = computed(() =>
    [...new Set((this.availablePermissions.data() ?? []).map((permission) => permission.resourceCode))].sort(),
  );
  readonly visiblePermissions = computed(() =>
    (this.availablePermissions.data() ?? []).filter((permission) => {
      const query = this.permissionSearch().toLocaleLowerCase();
      return (this.resourceFilter() === 'all' || permission.resourceCode === this.resourceFilter()) &&
        `${permission.name} ${permission.code} ${permission.actionCode}`.toLocaleLowerCase().includes(query) &&
        (this.assignmentFilter() === 'all' || this.draftIds().has(permission.id) === (this.assignmentFilter() === 'assigned'));
    }),
  );
  readonly dirty = computed(() => {
    const saved = this.savedIds();
    const draft = this.draftIds();
    return saved.size !== draft.size || [...saved].some((id) => !draft.has(id));
  });
  readonly resourceCounts = computed(() =>
    this.resources().map((code) => ({
      code,
      total: (this.availablePermissions.data() ?? []).filter((permission) => permission.resourceCode === code).length,
      selected: (this.availablePermissions.data() ?? []).filter((permission) => permission.resourceCode === code && this.draftIds().has(permission.id)).length,
    })),
  );

  constructor() {
    effect(() => {
      const roleId = this.roleId();
      const assigned = this.assignedPermissions.data();
      if (!roleId || !assigned || this.saving() || (this.loadedRoleId() === roleId && this.dirty())) return;
      const ids = new Set(assigned.map((permission) => permission.id));
      this.loadedRoleId.set(roleId);
      this.savedIds.set(ids);
      this.draftIds.set(new Set(ids));
    });
  }

  private hasPermission(code: string): boolean {
    return !!this.auth.authPerfil()?.permissions.some((permission) => permission.code === code);
  }

  countRoles(system: SystemRecord): number {
    return (this.rolesQuery.data() ?? []).filter((role) => role.systemId === system.id).length;
  }

  selectSystem(id: string): void {
    if (id === this.selectedSystem()?.id) return;
    this.requestLeave(() => {
      this.roleId.set(null);
      this.systemId.set(id);
      this.roleSearch.set('');
      this.resourceFilter.set('all');
    });
  }

  openRole(id: string): void {
    this.roleId.set(id);
    this.loadedRoleId.set(null);
    this.savedIds.set(new Set());
    this.draftIds.set(new Set());
    this.permissionSearch.set('');
    this.assignmentFilter.set('all');
    this.resourceFilter.set('all');
  }

  backToRoles(): void {
    this.requestLeave(() => this.roleId.set(null));
  }

  togglePermission(permission: Permiso, checked: boolean): void {
    if (!this.canAssign() || this.saving()) return;
    this.draftIds.update((ids) => {
      const next = new Set(ids);
      if (checked) next.add(permission.id);
      else next.delete(permission.id);
      return next;
    });
  }

  toggleVisible(): void {
    const visible = this.visiblePermissions();
    const add = !visible.every((permission) => this.draftIds().has(permission.id));
    this.draftIds.update((ids) => {
      const next = new Set(ids);
      for (const permission of visible) {
        if (add) next.add(permission.id);
        else next.delete(permission.id);
      }
      return next;
    });
  }

  discard(): void {
    this.draftIds.set(new Set(this.savedIds()));
  }

  async save(): Promise<boolean> {
    const role = this.selectedRole();
    if (!role || !this.dirty() || this.saving() || !this.canAssign()) return !this.dirty();
    this.saving.set(true);
    let completed = false;
    try {
      // Each endpoint changes one assignment. Stop at the first failure and reload actual server state.
      for (const id of this.draftIds()) {
        if (!this.savedIds().has(id)) await this.api.assign(role.id, id);
      }
      for (const id of this.savedIds()) {
        if (!this.draftIds().has(id)) await this.api.remove(role.id, id);
      }
      completed = true;
    } catch {
      this.toast.error('No se completaron todos los cambios. Se actualizará el estado real para que puedas reintentarlo.');
    } finally {
      const result = await this.assignedPermissions.refetch();
      if (result.data) {
        const actual = new Set(result.data.map((permission) => permission.id));
        this.savedIds.set(actual);
        if (completed) this.draftIds.set(new Set(actual));
      } else {
        completed = false;
        this.toast.error('No se pudo comprobar el estado de los permisos. Recarga el rol antes de continuar.');
      }
      this.saving.set(false);
    }
    if (completed) this.toast.success(`Permisos guardados para ${role.name}.`);
    return completed;
  }

  openCreate(): void {
    this.createName.set('');
    this.createDescription.set('');
    this.createError.set('');
    this.createDialog()?.nativeElement.showModal();
  }

  async createRole(event: Event): Promise<void> {
    event.preventDefault();
    const system = this.selectedSystem();
    const name = this.createName().trim();
    const description = this.createDescription().trim();
    if (!system || this.creating() || !this.canCreate()) return;
    if (!name || !description) {
      this.createError.set('Completa el nombre y la descripción del rol.');
      return;
    }
    this.creating.set(true);
    this.createError.set('');
    try {
      const role = await this.api.create(system.id, name, description);
      await this.queryClient.invalidateQueries({ queryKey: [...rolesQueryKey] });
      this.createDialog()?.nativeElement.close();
      this.toast.success(`Rol ${role.name} creado. Ahora puedes asignar sus permisos.`);
      this.openRole(role.id);
    } catch {
      this.createError.set('No se pudo crear el rol. Comprueba que el nombre no exista e inténtalo de nuevo.');
    } finally {
      this.creating.set(false);
    }
  }

  private requestLeave(action: () => void): void {
    if (!this.dirty()) {
      action();
      return;
    }
    void this.promptLeave().then((choice) => {
      if (choice === 'discard') {
        this.discard();
        action();
      } else if (choice === 'save') {
        void this.save().then((saved) => { if (saved) action(); });
      }
    });
  }

  confirmNavigation(): boolean | Promise<boolean> {
    if (!this.dirty()) return true;
    return this.promptLeave().then(async (choice) => {
      if (choice === 'discard') return true;
      if (choice === 'save') return this.save();
      return false;
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.dirty()) return;
    event.preventDefault();
    event.returnValue = '';
  }

  private promptLeave(): Promise<'cancel' | 'discard' | 'save'> {
    return new Promise((resolve) => {
      this.leaveResolver = resolve;
      const dialog = this.leaveDialog()?.nativeElement;
      if (dialog) dialog.showModal();
      else resolve('cancel');
    });
  }

  decideLeave(choice: 'cancel' | 'discard' | 'save'): void {
    const resolve = this.leaveResolver;
    this.leaveResolver = undefined;
    this.leaveDialog()?.nativeElement.close();
    resolve?.(choice);
  }

  closeLeaveDialog(): void {
    this.leaveResolver?.('cancel');
    this.leaveResolver = undefined;
  }
}
