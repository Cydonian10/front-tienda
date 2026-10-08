import { Component, computed, input, output, signal } from '@angular/core';
import { Permiso } from '../../../../../api/interfaces/access-control/permision.interface';

@Component({
  imports: [],
  selector: 'role-permission-preview',
  templateUrl: './role-permission-preview.html',
  host: { class: 'block space-y-4', 'aria-label': 'Vista previa de permisos' },
})
export class RolePermissionPreview {
  readonly roleName = input.required<string>();
  readonly systemName = input.required<string>();
  readonly permissions = input<Permiso[]>([]);
  readonly selectedPermissionIds = input.required<ReadonlySet<string>>();
  readonly loading = input(false);
  readonly error = input(false);
  readonly currentResourceCode = signal<string>('');

  readonly visiblePermissions = computed(() => {
    return this.permissions().filter((p) =>
      p.resourceCode.toLocaleLowerCase().includes(this.currentResourceCode().toLocaleLowerCase()),
    );
  });
  readonly allVisibleSelected = computed(() => {
    const visible = this.visiblePermissions();
    const selected = this.selectedPermissionIds();
    return visible.length > 0 && visible.every((permission) => selected.has(permission.id));
  });
  readonly resourceSummary = computed(() => {
    const resources = new Map<string, { code: string; selected: number; total: number }>();
    const selectedIds = this.selectedPermissionIds();
    for (const permission of this.permissions()) {
      const resource = resources.get(permission.resourceCode) ?? {
        code: permission.resourceCode,
        selected: 0,
        total: 0,
      };
      resource.total++;
      if (selectedIds.has(permission.id)) resource.selected++;
      resources.set(permission.resourceCode, resource);
    }
    return [...resources.values()];
  });

  readonly resourcesCode = computed(() => {
    const codes = this.permissions().map((p) => p.resourceCode);
    return [...new Set(codes)];
  });

  readonly deselectRole = output<void>();
  readonly retry = output<void>();
  readonly permissionSelectionChange = output<{ id: string; assigned: boolean }>();
  readonly visiblePermissionsChange = output<{ ids: string[]; assigned: boolean }>();

  toggleVisiblePermissions() {
    if (this.loading() || this.error() || !this.visiblePermissions().length) return;
    this.visiblePermissionsChange.emit({
      ids: this.visiblePermissions().map((permission) => permission.id),
      assigned: !this.allVisibleSelected(),
    });
  }

  onPermissionChange(id: string, event: Event) {
    this.permissionSelectionChange.emit({
      id,
      assigned: (event.target as HTMLInputElement).checked,
    });
  }
}
