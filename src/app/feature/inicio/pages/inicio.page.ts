import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CashMovementsService } from '../../../core/api/cash-movements.service';
import { CashRegistersService } from '../../../core/api/cash-registers.service';
import { ReportsService } from '../../../core/api/reports.service';
import { SalesService } from '../../../core/api/sales.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { CashMovement } from '../../../core/models/cash-movement.model';
import { ReportsOverview, SalesSummary } from '../../../core/models/report.model';
import { ROLE_NAMES } from '../../../core/models/role.model';
import { Sale } from '../../../core/models/sale.model';
import { AuthStore } from '../../../core/store/auth.store';
import BreadcrumbsNg from '../../../shared/breadcrumbs/breadcrumbs.ng';
import {
  currentReportPeriod,
  toAppliedReportPeriod,
} from '../../reportes/components/report-period-filter/report-period';
import { ManagementDashboard } from '../components/management-dashboard/management-dashboard';
import {
  ManagementDashboardData,
  WorkerDashboardData,
  WorkerDashboardSession,
} from '../components/dashboard-contracts';
import { WorkerDashboard } from '../components/worker-dashboard/worker-dashboard';

@Component({
  selector: 'inicio-page',
  imports: [BreadcrumbsNg, ManagementDashboard, WorkerDashboard],
  templateUrl: './inicio.page.html',
})
export default class InicioPage {
  private readonly authStore = inject(AuthStore);
  private readonly cashMovementsService = inject(CashMovementsService);
  private readonly cashRegistersService = inject(CashRegistersService);
  private readonly dashboardService = inject(DashboardService);
  private readonly reportsService = inject(ReportsService);
  private readonly salesService = inject(SalesService);

  protected readonly dashboardRole = this.dashboardService.dashboardRole;
  protected readonly isWorker = computed(() => this.dashboardRole() === ROLE_NAMES.WORKER);
  protected readonly ownSessions = signal<WorkerDashboardSession[]>([]);
  protected readonly recentSales = signal<Sale[]>([]);
  protected readonly recentMovements = signal<CashMovement[]>([]);
  protected readonly isLoadingSessions = signal(true);
  protected readonly isLoadingSales = signal(true);
  protected readonly isLoadingMovements = signal(true);
  protected readonly sessionsError = signal<string | null>(null);
  protected readonly salesError = signal<string | null>(null);
  protected readonly movementsError = signal<string | null>(null);
  protected readonly weeklyPeriod = toAppliedReportPeriod(currentReportPeriod())!;
  protected readonly summary = signal<SalesSummary | null>(null);
  protected readonly overview = signal<ReportsOverview | null>(null);
  protected readonly isLoadingSummary = signal(true);
  protected readonly isLoadingOverview = signal(true);
  protected readonly summaryError = signal<string | null>(null);
  protected readonly overviewError = signal<string | null>(null);

  protected readonly workerData = computed<WorkerDashboardData>(() => {
    const person = this.authStore.person();
    return {
      personName: person ? `${person.firstName} ${person.lastName}` : 'trabajador',
      sessions: {
        data: this.ownSessions(),
        isLoading: this.isLoadingSessions(),
        error: this.sessionsError(),
      },
      recentSales: {
        data: this.recentSales(),
        isLoading: this.isLoadingSales(),
        error: this.salesError(),
      },
      recentMovements: {
        data: this.recentMovements(),
        isLoading: this.isLoadingMovements(),
        error: this.movementsError(),
      },
    };
  });

  protected readonly managementData = computed<ManagementDashboardData | null>(() => {
    const role = this.dashboardRole();
    if (role !== ROLE_NAMES.ADMINISTRATOR && role !== ROLE_NAMES.RESPONSIBLE) return null;
    return {
      role,
      weekLabel: `${this.weeklyPeriod.startDate} al ${this.weeklyPeriod.endDate}`,
      summary: {
        data: this.summary(),
        isLoading: this.isLoadingSummary(),
        error: this.summaryError(),
      },
      overview: {
        data: this.overview(),
        isLoading: this.isLoadingOverview(),
        error: this.overviewError(),
      },
      links: this.dashboardService.authorizedRoutes([
        'historial-ventas',
        'sesiones-caja',
        'movimientos-caja',
        'reportes',
      ]),
    };
  });

  constructor() {
    if (this.isWorker()) {
      void this.loadWorkerData();
    } else if (this.managementData()) {
      void this.loadManagementData();
    }
  }

  protected async retrySessions(): Promise<void> {
    await this.loadWorkerSessions();
  }

  protected async retrySales(): Promise<void> {
    await this.loadRecentSales();
  }

  protected async retryMovements(): Promise<void> {
    await this.loadRecentMovements(this.ownSessions());
  }

  protected async retrySummary(): Promise<void> {
    await this.loadSummary();
  }

  protected async retryOverview(): Promise<void> {
    await this.loadOverview();
  }

  private async loadWorkerData(): Promise<void> {
    await Promise.all([this.loadWorkerSessions(), this.loadRecentSales()]);
  }

  private async loadWorkerSessions(): Promise<void> {
    const person = this.authStore.person();
    if (!person) {
      this.ownSessions.set([]);
      this.sessionsError.set('No se pudo identificar la persona de la sesión.');
      this.isLoadingSessions.set(false);
      this.recentMovements.set([]);
      this.movementsError.set('No se pudo identificar la sesión propia para cargar movimientos.');
      this.isLoadingMovements.set(false);
      return;
    }

    this.isLoadingSessions.set(true);
    this.sessionsError.set(null);
    try {
      const sessions = await this.loadOwnSessions(person.id);
      this.ownSessions.set(sessions);
      await this.loadRecentMovements(sessions);
    } catch (error) {
      this.ownSessions.set([]);
      this.recentMovements.set([]);
      this.sessionsError.set(this.message(error));
      this.movementsError.set('No se pudieron identificar las sesiones propias para cargar movimientos.');
      this.isLoadingMovements.set(false);
    } finally {
      this.isLoadingSessions.set(false);
    }
  }

  private async loadOwnSessions(personId: number): Promise<WorkerDashboardSession[]> {
    const registers = await firstValueFrom(this.cashRegistersService.findAll());
    return registers.flatMap((register) => {
      const opening = register.openOpening;
      if (!opening || opening.responsible.id !== personId) return [];
      return [
        {
          registerId: register.id,
          registerCode: register.code,
          registerName: register.name,
          openingId: opening.id,
          openedAt: opening.openedAt,
          openingAmount: opening.openingAmount,
        },
      ];
    });
  }

  private async loadRecentSales(): Promise<void> {
    this.isLoadingSales.set(true);
    this.salesError.set(null);
    try {
      const result = await firstValueFrom(this.salesService.findAll({ page: 1, limit: 5 }));
      this.recentSales.set(result.data);
    } catch (error) {
      this.recentSales.set([]);
      this.salesError.set(this.message(error));
    } finally {
      this.isLoadingSales.set(false);
    }
  }

  private async loadRecentMovements(sessions: WorkerDashboardSession[]): Promise<void> {
    this.isLoadingMovements.set(true);
    this.movementsError.set(null);
    try {
      if (sessions.length === 0) {
        this.recentMovements.set([]);
        return;
      }
      const results = await Promise.all(
        sessions.map((session) =>
          firstValueFrom(
            this.cashMovementsService.findAll({
              cashOpeningId: session.openingId,
              page: 1,
              limit: 5,
            }),
          ),
        ),
      );
      this.recentMovements.set(
        results
          .flatMap((result) => result.data)
          .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
          .slice(0, 5),
      );
    } catch (error) {
      this.recentMovements.set([]);
      this.movementsError.set(this.message(error));
    } finally {
      this.isLoadingMovements.set(false);
    }
  }

  private async loadManagementData(): Promise<void> {
    await Promise.all([this.loadSummary(), this.loadOverview()]);
  }

  private async loadSummary(): Promise<void> {
    this.isLoadingSummary.set(true);
    this.summaryError.set(null);
    try {
      this.summary.set(
        await firstValueFrom(
          this.reportsService.findSalesSummary(this.weeklyPeriod.from, this.weeklyPeriod.to),
        ),
      );
    } catch (error) {
      this.summary.set(null);
      this.summaryError.set(this.message(error));
    } finally {
      this.isLoadingSummary.set(false);
    }
  }

  private async loadOverview(): Promise<void> {
    this.isLoadingOverview.set(true);
    this.overviewError.set(null);
    try {
      this.overview.set(
        await firstValueFrom(
          this.reportsService.findOverview({
            from: this.weeklyPeriod.from,
            to: this.weeklyPeriod.to,
          }),
        ),
      );
    } catch (error) {
      this.overview.set(null);
      this.overviewError.set(this.message(error));
    } finally {
      this.isLoadingOverview.set(false);
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
