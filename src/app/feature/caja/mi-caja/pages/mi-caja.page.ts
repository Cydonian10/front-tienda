import { Dialog } from '@angular/cdk/dialog';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { CashRegisterOpeningsService } from '../../../../core/api/cash-register-openings.service';
import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { PaymentMethodsService } from '../../../../core/api/payment-methods.service';
import {
  CashRegister,
  CashRegisterOpening,
  CashResponsible,
} from '../../../../core/models/cash-register.model';
import { AuthStore } from '../../../../core/store/auth.store';
import { RealtimeService } from '../../../../core/realtime/realtime.service';
import type { RealtimeEvent } from '../../../../core/realtime/realtime-event.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { BusinessDatePipe } from '../../../../shared/pipes/business-date.pipe';
import { openCashRegisterOpeningDialog } from '../../dialogs/cash-register-opening-dialog';
import { openCashMovementDialog } from '../dialogs/cash-movement-dialog';
import { openCashRegisterClosingDialog } from '../dialogs/cash-register-closing-dialog';

@Component({
  selector: 'my-cash-page',
  imports: [BreadcrumbsNg, BusinessDatePipe, DecimalPipe],
  templateUrl: './mi-caja.page.html',
})
export default class MiCajaPage {
  private readonly dialog = inject(Dialog);
  private readonly openingsService = inject(CashRegisterOpeningsService);
  private readonly registersService = inject(CashRegistersService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly authStore = inject(AuthStore);
  private readonly realtimeService = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly registers = signal<CashRegister[]>([]);
  protected readonly openings = signal<CashRegisterOpening[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly availableRegisters = computed(() =>
    this.registers().filter((register) => register.active && !register.openOpening),
  );

  constructor() {
    void this.load();
    this.destroyRef.onDestroy(
      this.realtimeService.onEvent((event) => this.handleRealtimeEvent(event)),
    );
  }

  protected async load(): Promise<void> {
    const person = this.authStore.person();
    if (!person) {
      this.error.set('No se pudo identificar la persona de la sesión.');
      this.isLoading.set(false);
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const registers = await firstValueFrom(this.registersService.findAll());
      this.registers.set(registers);
      const ownOpeningIds = registers.flatMap((register) =>
        register.openOpening?.responsible.id === person.id ? [register.openOpening.id] : [],
      );
      this.openings.set(
        await Promise.all(
          ownOpeningIds.map((openingId) => firstValueFrom(this.openingsService.findOne(openingId))),
        ),
      );
    } catch (error) {
      this.openings.set([]);
      this.error.set(this.message(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected open(register: CashRegister): void {
    const person = this.authStore.person();
    if (!person || !register.active || register.openOpening) return;
    const currentPerson: CashResponsible = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
    };
    const ref = openCashRegisterOpeningDialog(this.dialog, {
      register,
      isAdmin: false,
      currentPerson,
      responsibles: [],
    });
    ref.closed.subscribe((opening) => {
      if (!opening) return;
      toast.success('Caja abierta correctamente');
      void this.load();
    });
  }

  protected addMovement(opening: CashRegisterOpening): void {
    const ref = openCashMovementDialog(this.dialog, opening);
    ref.closed.subscribe((movement) => {
      if (movement) toast.success('Movimiento registrado correctamente');
    });
  }

  protected async close(opening: CashRegisterOpening): Promise<void> {
    this.actionError.set(null);
    try {
      const paymentMethods = await firstValueFrom(this.paymentMethodsService.findActive());
      if (paymentMethods.length === 0) {
        this.actionError.set('No hay métodos de pago activos para realizar el arqueo.');
        return;
      }
      const ref = openCashRegisterClosingDialog(this.dialog, { opening, paymentMethods });
      ref.closed.subscribe((closedOpening) => {
        if (!closedOpening) return;
        toast.success('Sesión cerrada correctamente');
        void this.load();
      });
    } catch (error) {
      this.actionError.set(this.message(error));
    }
  }

  private handleRealtimeEvent(event: RealtimeEvent): void {
    if (event.name === 'cash.opened' || event.name === 'cash.closed') {
      void this.load();
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
