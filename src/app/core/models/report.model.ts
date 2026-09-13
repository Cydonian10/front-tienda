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
