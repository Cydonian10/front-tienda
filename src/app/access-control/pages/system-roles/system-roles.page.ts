import { Component, computed, inject } from '@angular/core';
import { TitleHeaderAdmin } from '../../../shared/components/title-header-admin/title-header-admin';
import { findSystemsQuery } from '../../actions/systems/find-systems-action';
import { System } from '../../../api/interfaces/access-control/system.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeaderSystemRolPage, StepActiveProps } from './components/header-system-rol';
import { findRolesQuery } from '../../actions/roles/roles-actions';
import { SystemSelector } from './components/system-selector';
import { SystemRolesPanel } from './components/system-roles-panel';

@Component({
  imports: [TitleHeaderAdmin, HeaderSystemRolPage, SystemSelector, SystemRolesPanel],
  selector: 'app-system-roles',
  template: `
    <app-title-header-admin
      title="Sistemas y roles"
      description="Organiza el acceso de tu equipo a cada sistema."
    />

    <header-system-rol [stepActive]="stepActive()" />

    <div class="grid gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
      <system-selector
        [systems]="systemQuery.data() ?? []"
        [selectedSystemCode]="selectedSystem()?.code ?? null"
        (systemSelected)="setSelectedSystem($event)"
      />

      @if (selectedSystem(); as system) {
        <system-roles-panel
          [system]="system"
          [roles]="rolesQuery.data() ?? []"
          [loading]="rolesQuery.isLoading()"
          [error]="rolesQuery.isError()"
          (retry)="rolesQuery.refetch()"
        />
      }
    </div>
  `,
  host: { class: 'block space-y-6' },
})
export default class SystemRolesPage {
  readonly systemQuery = findSystemsQuery();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly systemCode = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  setSelectedSystem(system: System) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { system: system.code },
      queryParamsHandling: 'merge',
    });
  }

  readonly selectedSystem = computed(
    () =>
      this.systemQuery.data()?.find((system) => system.code === this.systemCode().get('system')) ??
      null,
  );

  protected readonly stepActive = computed<StepActiveProps>(() =>
    this.selectedSystem() ? 'roles' : 'system',
  );

  // Roles logica

  readonly rolesQuery = findRolesQuery(() => this.selectedSystem()?.id);
}
