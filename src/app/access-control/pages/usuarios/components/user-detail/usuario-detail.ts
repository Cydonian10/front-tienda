import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../../../shared/components/icon/icon';
import {
  DemoUser,
  DemoSystem,
  DemoRole,
  demoFullName,
  demoInitials,
  DemoAssignment,
  demoToday,
} from '../../usuarios-demo.data';

@Component({
  selector: 'app-usuario-detail',
  imports: [FormsModule, Icon],
  host: { class: 'block min-w-0' },
  templateUrl: './usuario-detail.html',
})
export class UsuarioDetail {
  readonly user = input.required<DemoUser>();
  readonly systems = input.required<DemoSystem[]>();
  readonly roles = input.required<DemoRole[]>();
  readonly edit = output<void>();
  readonly assign = output<void>();
  readonly remove = output<string>();
  protected readonly fullName = demoFullName;
  protected readonly initials = demoInitials;
  protected readonly systemFilter = signal('all');
  protected readonly visibleAssignments = computed(() =>
    this.user().roles.flatMap((assignment) => {
      const role = this.roles().find((item) => item.id === assignment.roleId);
      const system = this.systems().find((item) => item.id === role?.systemId);
      return role && system && (this.systemFilter() === 'all' || system.id === this.systemFilter())
        ? [{ assignment, role, system }]
        : [];
    }),
  );

  protected state(assignment: DemoAssignment): string {
    const today = demoToday();
    if (assignment.validFrom > today) return 'Pendiente';
    if (assignment.validUntil && assignment.validUntil < today) return 'Vencido';
    return 'Vigente';
  }
}
