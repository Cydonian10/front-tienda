import { Component, computed, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  SearchSelect,
  SearchSelectOption,
} from '../../../shared/components/search-select/search-select';
import { Icon } from '../../../shared/components/icon/icon';
import { getPermisosQuery } from '../../actions/permisos/get-permisos-action';

const byLabel = (a: SearchSelectOption, b: SearchSelectOption) =>
  a.label.localeCompare(b.label, 'es');

@Component({
  imports: [SearchSelect, ReactiveFormsModule, Icon],
  selector: 'app-permisos',
  templateUrl: './permiso.page.html',
  host: { class: 'block min-w-0' },
})
export default class PermisosPage {
  readonly permisosQuery = getPermisosQuery();
  readonly systemControl = new FormControl<string | null>({ value: null, disabled: true });
  readonly resourceControl = new FormControl<string | null>({ value: null, disabled: true });
  readonly selectedSystem = toSignal(this.systemControl.valueChanges, { initialValue: null });
  readonly selectedResource = toSignal(this.resourceControl.valueChanges, { initialValue: null });

  readonly systems = computed<SearchSelectOption[]>(() => {
    const options = new Map<string, string>();
    for (const permission of this.permisosQuery.data() ?? []) {
      options.set(permission.systemCode, permission.systemName || permission.systemCode);
    }
    return Array.from(options, ([value, label]) => ({ value, label })).sort(byLabel);
  });

  readonly resources = computed<SearchSelectOption[]>(() => {
    const codes = new Set(
      (this.permisosQuery.data() ?? [])
        .filter(
          (permission) => !this.selectedSystem() || permission.systemCode === this.selectedSystem(),
        )
        .map((permission) => permission.resourceCode),
    );
    return Array.from(codes, (value) => ({ value, label: value })).sort(byLabel);
  });

  readonly filteredPermissions = computed(() =>
    (this.permisosQuery.data() ?? []).filter(
      (permission) =>
        (!this.selectedSystem() || permission.systemCode === this.selectedSystem()) &&
        (!this.selectedResource() || permission.resourceCode === this.selectedResource()),
    ),
  );

  readonly hasFilters = computed(() => !!(this.selectedSystem() || this.selectedResource()));

  constructor() {
    effect(() => {
      if (this.systems().length && !this.permisosQuery.isError()) {
        this.systemControl.enable({ emitEvent: false });
      } else {
        this.systemControl.disable({ emitEvent: false });
      }
    });
    effect(() => {
      if (this.resources().length && !this.permisosQuery.isError()) {
        this.resourceControl.enable({ emitEvent: false });
      } else {
        this.resourceControl.disable({ emitEvent: false });
      }
    });
  }

  onSystemChange(): void {
    // A resource selected in another system should never leave an invisible filter behind.
    this.resourceControl.setValue(null);
  }

  clearFilters(): void {
    this.systemControl.setValue(null);
    this.resourceControl.setValue(null);
  }
}
