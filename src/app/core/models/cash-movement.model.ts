import { PaginationQuery } from './pagination.model';

export type CashMovementType = 'income' | 'expense';

export interface CashMovement {
  id: number;
  cashOpeningId: number;
  cashRegisterId: number;
  cashRegisterName: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdAt: string;
  createdById: number;
  createdByName: string;
}

export interface CreateCashMovement {
  cashOpeningId: number;
  type: CashMovementType;
  amount: number;
  reason: string;
}

export interface CashMovementFilter extends PaginationQuery {
  cashOpeningId?: number;
  cashRegisterId?: number;
  type?: CashMovementType;
  createdById?: number;
  startDate?: string;
  endDate?: string;
}
