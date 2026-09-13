import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { CashRegisterOpeningsService } from '../../../../core/api/cash-register-openings.service';
import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { PeopleService } from '../../../../core/api/people.service';
import {
  CashRegister,
  CashRegisterOpening,
  CashResponsible,
} from '../../../../core/models/cash-register.model';
import { ROLE_NAMES } from '../../../../core/models/role.model';
import { AuthStore } from '../../../../core/store/auth.store';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { openCashRegisterOpeningDialog } from '../../../operaciones/cajas/dialogs/cash-register-opening-dialog';
import { CashSessionsTable } from '../components/cash-sessions-table/cash-sessions-table';
import { openCashSessionDetailDialog } from '../dialogs/cash-session-detail-dialog';

@Component({
  selector: 'cash-sessions-page',
  imports: [BreadcrumbsNg, CashSessionsTable],
  templateUrl: './sesiones.page.html',
})
export default class SesionesPage {
  private readonly dialog = inject(Dialog);
  private readonly openingsService = inject(CashRegisterOpeningsService);
  private readonly registersService = inject(CashRegistersService);
  private readonly peopleService = inject(PeopleService);
  private readonly authStore = inject(AuthStore);
  private readonly today = new Date();

  protected readonly registers = signal<CashRegister[]>([]);
  protected readonly openings = signal<CashRegisterOpening[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isOpening = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly currentYear = signal(this.today.getFullYear());
  protected readonly currentMonth = signal(this.today.getMonth() + 1);
  protected readonly canOpenForAnother = computed(
    () => this.authStore.user()?.roles.includes(ROLE_NAMES.ADMINISTRATOR) ?? false,
  );
  protected readonly availableRegisters = computed(() =>
    this.registers().filter((register) => register.active && !register.openOpening),
  );

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const registers = await firstValueFrom(this.registersService.findAll());
      this.registers.set(registers);
      const histories = await Promise.all(
        registers.map((register) =>
          firstValueFrom(
            this.openingsService.findAll({
              cashRegisterId: register.id,
              year: this.currentYear(),
              month: this.currentMonth(),
            }),
          ),
        ),
      );
      this.openings.set(
        histories
          .flat()
          .sort((left, right) => Date.parse(right.openedAt) - Date.parse(left.openedAt)),
      );
    } catch (error) {
      this.openings.set([]);
      this.error.set(this.message(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected changeMonth(offset: number): void {
    const date = new Date(this.currentYear(), this.currentMonth() - 1 + offset, 1);
    this.currentYear.set(date.getFullYear());
    this.currentMonth.set(date.getMonth() + 1);
    void this.load();
  }

  protected async open(register: CashRegister): Promise<void> {
    const person = this.authStore.person();
    if (!person || !this.canOpenForAnother() || !register.active || register.openOpening) return;
    this.isOpening.set(true);
    this.actionError.set(null);
    try {
      const responsibles = await firstValueFrom(this.peopleService.findCashResponsibles());
      const currentPerson: CashResponsible = {
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
      };
      const ref = openCashRegisterOpeningDialog(this.dialog, {
        register,
        isAdmin: true,
        currentPerson,
        responsibles,
      });
      ref.closed.subscribe((opening) => {
        if (!opening) return;
        toast.success('Sesión abierta correctamente');
        void this.load();
      });
    } catch (error) {
      this.actionError.set(this.message(error));
    } finally {
      this.isOpening.set(false);
    }
  }

  protected async showDetail(opening: CashRegisterOpening): Promise<void> {
    this.actionError.set(null);
    try {
      openCashSessionDetailDialog(
        this.dialog,
        await firstValueFrom(this.openingsService.findOne(opening.id)),
      );
    } catch (error) {
      this.actionError.set(this.message(error));
    }
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'Error inesperado');
  }
}
