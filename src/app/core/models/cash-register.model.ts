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
  openedById: number;
  openedBy: CashResponsible;
  responsible: CashResponsible;
  closedById: number | null;
  closedBy: CashResponsible | null;
  openedAt: string;
  closedAt: string | null;
  status: 'open' | 'closed';
  openingAmount: number;
  expectedAmount: number;
  realAmount: number | null;
  difference: number | null;
  closingDetails: CashRegisterClosingDetail[];
}

export interface CashRegisterClosingDetail {
  paymentMethod: {
    id: number;
    name: string;
    active: boolean;
  };
  expectedAmount: number;
  realAmount: number;
  difference: number;
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

export interface CloseCashRegisterOpening {
  details: CloseCashRegisterOpeningDetail[];
}

export interface CloseCashRegisterOpeningDetail {
  paymentMethodId: number;
  realAmount: number;
}
