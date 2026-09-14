export interface SalesSummary {
  from: string;
  to: string;
  paidAmount: number;
  paidCount: number;
  averageTicket: number;
  cancelledCount: number;
  cancelledAmount: number;
}

export interface ReportRange {
  from: string;
  to: string;
}

export interface ReportsOverview {
  paidAmount: number;
  paidCount: number;
  averageTicket: number;
  cancelledAmount: number;
  cancelledCount: number;
  topSeller: {
    sellerId: number;
    sellerName: string;
    paidAmount: number;
  } | null;
  topProduct: {
    productId: number;
    productName: string;
    quantityBase: number;
  } | null;
  paymentMethods: Array<{
    paymentMethodId: number;
    name: string;
    paidAmount: number;
    percentage: number;
  }>;
}

export interface SalesByDay {
  date: string;
  paidAmount: number;
  paidCount: number;
  cancelledAmount: number;
  cancelledCount: number;
}

export interface SellerReport {
  sellerId: number;
  sellerName: string;
  paidAmount: number;
  paidCount: number;
  averageTicket: number;
  cancelledAmount: number;
  cancelledCount: number;
}

export interface ProductReport {
  productId: number;
  productName: string;
  quantityBase: number;
  paidAmount: number;
  paidCount: number;
}

export interface PaymentMethodReport {
  paymentMethodId: number;
  name: string;
  paidAmount: number;
  paidCount: number;
  percentage: number;
}

export interface CashRegisterReport {
  closedSessions: ClosedCashRegisterSessionReport[];
  openSessions: OpenCashRegisterSessionReport[];
}

export interface ClosedCashRegisterSessionReport {
  openingId: number;
  cashRegisterId: number;
  cashRegisterName: string;
  responsibleName: string;
  openedAt: string;
  closedAt: string;
  expectedAmount: number;
  realAmount: number;
  difference: number;
  closingDetails: CashRegisterClosingDetail[];
}

export interface OpenCashRegisterSessionReport {
  openingId: number;
  cashRegisterId: number;
  cashRegisterName: string;
  responsibleName: string;
  openedAt: string;
  expectedAmount: number;
}
import { CashRegisterClosingDetail } from './cash-register.model';
