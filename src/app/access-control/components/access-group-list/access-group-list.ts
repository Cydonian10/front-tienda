import { Component, computed, input, output } from '@angular/core';
import { type Permiso } from '../../../api/interfaces/access-control/permision.interface';
import { accessGroupStates, type AccessGroupState } from '../../models/access-groups';

@Component({
  selector: 'app-access-group-list',
  templateUrl: './access-group-list.html',
  host: { class: 'block min-w-0' },
})
export class AccessGroupList {
  readonly permissions = input<Permiso[]>([]);
  readonly selectedIds = input<ReadonlySet<string>>(new Set());
  readonly systemCode = input.required<string>();
  readonly readOnly = input(false);
  readonly disabled = input(false);
  readonly selectionChange = output<{ ids: string[]; assigned: boolean }>();
  readonly groups = computed(() =>
    accessGroupStates(this.permissions(), this.selectedIds(), this.systemCode()),
  );

  toggle(group: AccessGroupState): void {
    if (this.disabled() || this.readOnly() || !group.available) return;
    this.selectionChange.emit({ ids: group.ids, assigned: !group.checked });
  }
}
