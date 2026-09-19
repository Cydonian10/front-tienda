import { CashMovement } from '../../../core/models/cash-movement.model';
import { DashboardNavigationLink } from '../../../core/services/dashboard.service';
import { ROLE_NAMES } from '../../../core/models/role.model';
import { ReportsOverview, SalesByDay, SalesSummary } from '../../../core/models/report.model';
import { Sale } from '../../../core/models/sale.model';

export interface WorkerDashboardSession {
  registerId: number;
  registerCode: string;
  registerName: string;
  openingId: number;
  openedAt: string;
  openingAmount: number;
}

export interface WorkerDashboardData {
  personName: string;
  sessions: DashboardBlock<WorkerDashboardSession[]>;
  recentSales: DashboardBlock<Sale[]>;
  recentMovements: DashboardBlock<CashMovement[]>;
}

export interface DashboardBlock<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

export type ManagementDashboardRole =
  | typeof ROLE_NAMES.ADMINISTRATOR
  | typeof ROLE_NAMES.RESPONSIBLE;

export interface ManagementDashboardData {
  role: ManagementDashboardRole;
  weekLabel: string;
  summary: DashboardBlock<SalesSummary | null>;
  overview: DashboardBlock<ReportsOverview | null>;
  salesTrend: DashboardBlock<SalesByDay[] | null>;
  links: DashboardNavigationLink[];
}
