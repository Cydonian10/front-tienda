export interface CashResponsible {
  id: number;
  firstName: string;
  lastName: string;
}

export interface CashRegisterOpeningSummary {
  id: number;
  openedAt: string;
  openingAmount: number;
  status: 'open';
  responsible: CashResponsible;
}

export interface CashRegister {
  id: number;
  code: string;
  name: string;
  active: boolean;
  openOpening: CashRegisterOpeningSummary | null;
}

export interface CashRegisterOpening {
  id: number;
  cashRegister: Pick<CashRegister, 'id' | 'code' | 'name' | 'active'>;
  openedBy: CashResponsible;
  responsible: CashResponsible;
  openedAt: string;
  status: 'open' | 'closed';
  openingAmount: number;
}

export interface CreateCashRegister {
  code: string;
  name: string;
}

export interface UpdateCashRegister {
  code?: string;
  name?: string;
  active?: boolean;
}

export interface CreateCashRegisterOpening {
  cashRegisterId: number;
  openingAmount: number;
  responsibleId?: number;
}

export interface CashRegisterOpeningFilter {
  cashRegisterId: number;
  year: number;
  month: number;
}
