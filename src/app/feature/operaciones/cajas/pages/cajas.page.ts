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
import { AuthStore } from '../../../../core/store/auth.store';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { CashOpeningsHistoryTable } from '../components/cash-openings-history-table/cash-openings-history-table';
import { CashRegistersTable } from '../components/cash-registers-table/cash-registers-table';
import { openCashRegisterDialog } from '../dialogs/cash-register-dialog';
import { openCashRegisterOpeningDialog } from '../dialogs/cash-register-opening-dialog';

@Component({
  selector: 'cajas-page',
  imports: [BreadcrumbsNg, CashRegistersTable, CashOpeningsHistoryTable],
  templateUrl: './cajas.page.html',
})
export default class CajasPage {
  private readonly dialog = inject(Dialog);
  private readonly registersService = inject(CashRegistersService);
  private readonly openingsService = inject(CashRegisterOpeningsService);
  private readonly peopleService = inject(PeopleService);
  private readonly authStore = inject(AuthStore);
  protected readonly registers = signal<CashRegister[]>([]);
  protected readonly selected = signal<CashRegister | null>(null);
  protected readonly openings = signal<CashRegisterOpening[]>([]);
  protected readonly isLoadingRegisters = signal(true);
  protected readonly isLoadingHistory = signal(false);
  protected readonly registersError = signal<string | null>(null);
  protected readonly historyError = signal<string | null>(null);
  private readonly today = new Date();
  protected readonly currentYear = signal(this.today.getFullYear());
  protected readonly currentMonth = signal(this.today.getMonth() + 1);
  protected readonly canManage = computed(
    () => this.authStore.user()?.roles.includes('ADMINISTRADOR') ?? false,
  );
  constructor() {
    void this.loadRegisters();
  }
  protected async loadRegisters(): Promise<void> {
    this.isLoadingRegisters.set(true);
    this.registersError.set(null);
    try {
      const registers = await firstValueFrom(this.registersService.findAll());
      this.registers.set(registers);
      const selected = this.selected();
      const current = selected
        ? (registers.find((register) => register.id === selected.id) ?? null)
        : (registers[0] ?? null);
      this.selected.set(current);
      if (current) await this.loadHistory(current);
      else this.openings.set([]);
    } catch (error) {
      this.registersError.set(this.message(error));
    } finally {
      this.isLoadingRegisters.set(false);
    }
  }
  protected select(register: CashRegister): void {
    if (register.id !== this.selected()?.id) {
      this.selected.set(register);
      void this.loadHistory(register);
    }
  }
  protected changeMonth(offset: number): void {
    const date = new Date(this.currentYear(), this.currentMonth() - 1 + offset, 1);
    this.currentYear.set(date.getFullYear());
    this.currentMonth.set(date.getMonth() + 1);
    const selected = this.selected();
    if (selected) void this.loadHistory(selected);
  }
  protected create(): void {
    const ref = openCashRegisterDialog(this.dialog);
    ref.closed.subscribe((register) => {
      if (register) {
        this.registers.update((items) => [register, ...items]);
        toast.success('Caja creada correctamente');
      }
    });
  }
  protected edit(register: CashRegister): void {
    const ref = openCashRegisterDialog(this.dialog, register);
    ref.closed.subscribe((updated) => {
      if (!updated) return;
      this.registers.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (this.selected()?.id === updated.id) this.selected.set(updated);
      toast.success('Caja actualizada correctamente');
    });
  }
  protected async open(register: CashRegister): Promise<void> {
    if (!register.active || register.openOpening) return;
    const person = this.authStore.person();
    if (!person) {
      toast.error('No se pudo identificar la persona de la sesión');
      return;
    }
    const currentPerson: CashResponsible = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
    };
    let responsibles: CashResponsible[] = [];
    try {
      if (this.canManage())
        responsibles = await firstValueFrom(this.peopleService.findCashResponsibles());
    } catch (error) {
      toast.error(this.message(error));
      return;
    }
    const ref = openCashRegisterOpeningDialog(this.dialog, {
      register,
      isAdmin: this.canManage(),
      currentPerson,
      responsibles,
    });
    ref.closed.subscribe((opening) => {
      if (!opening) return;
      toast.success('Caja abierta correctamente');
      void this.loadRegisters();
    });
  }
  private async loadHistory(register: CashRegister): Promise<void> {
    this.isLoadingHistory.set(true);
    this.historyError.set(null);
    try {
      this.openings.set(
        await firstValueFrom(
          this.openingsService.findAll({
            cashRegisterId: register.id,
            year: this.currentYear(),
            month: this.currentMonth(),
          }),
        ),
      );
    } catch (error) {
      this.historyError.set(this.message(error));
    } finally {
      this.isLoadingHistory.set(false);
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
