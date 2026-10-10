import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/components/icon/icon';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../shared/components/skeleton/skeleton';
import { useSystemsQuery } from '../actions/find-systems-action';
import { MySystemsHeader } from '../components/my-systems-header';
import { SystemCard } from '../components/system-card';

@Component({
  selector: 'app-my-systems-page',
  imports: [EmptyState, FormsModule, Icon, MySystemsHeader, Skeleton, SystemCard],
  templateUrl: './my-systems.page.html',
  host: { class: 'block min-h-dvh' },
})
export default class MySystemsPage {
  readonly systemsQuery = useSystemsQuery();

  readonly searchTerm = signal('');

  readonly systems = computed(() =>
    [...(this.systemsQuery.data() ?? [])].sort((left, right) => left.order - right.order),
  );

  readonly filteredSystems = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase('es');
    if (!term) return this.systems();

    return this.systems().filter((system) =>
      [system.name, system.description, system.code].some((value) =>
        value.toLocaleLowerCase('es').includes(term),
      ),
    );
  });
}
