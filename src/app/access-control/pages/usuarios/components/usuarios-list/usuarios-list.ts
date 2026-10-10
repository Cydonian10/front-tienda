import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../../shared/components/icon/icon';
import { DemoUser, demoFullName, demoInitials } from '../../usuarios-demo.data';

@Component({
  selector: 'app-usuarios-list',
  imports: [FormsModule, Icon],
  host: {
    class: 'overflow-hidden rounded-box border border-base-300 bg-base-100 block',
    'aria-label': 'Lista de usuarios',
  },
  templateUrl: './usuarios-list.html',
})
export class UsuariosList {
  readonly users = input.required<DemoUser[]>();
  readonly filteredUsers = input.required<DemoUser[]>();
  readonly selectedId = input<string | null>(null);
  readonly search = input('');
  readonly status = input('all');
  readonly searchChange = output<string>();
  readonly statusChange = output<string>();
  readonly selectUser = output<string>();
  protected readonly fullName = demoFullName;
  protected readonly initials = demoInitials;
}
