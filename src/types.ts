export interface BackpackCredentials {
  apiKey: string;
  privateKey: string;
}

export interface BackpackRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  params?: Record<string, any>;
  body?: any;
}

export interface BackpackFill {
  id: string;
  orderId: string;
  symbol: string;
  side: 'Bid' | 'Ask';
  quantity: string;
  price: string;
  fee: string;
  feeSymbol: string;
  tradeId: string;
  timestamp: number;
  blockTradeId?: string;
  quoteId?: string;
}

export interface BackpackOrder {
  id: string;
  clientId?: string;
  symbol: string;
  side: 'Bid' | 'Ask';
  orderType: 'Limit' | 'Market' | 'Stop' | 'StopLimit';
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  quantity: string;
  price?: string;
  triggerPrice?: string;
  status: 'New' | 'Cancelled' | 'Filled' | 'PartiallyFilled' | 'Expired';
  createdAt: number;
  updatedAt: number;
  fills?: BackpackFill[];
}

export interface BackpackFundingPayment {
  id: string;
  symbol: string;
  payment: string;
  rate: string;
  timestamp: number;
}

export interface BackpackSettlement {
  id: string;
  symbol: string;
  markPrice: string;
  pnl: string;
  timestamp: number;
}

export interface HistoryResponse<T> {
  data: T[];
  hasMore: boolean;
  nextOffset?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  from?: number;
  to?: number;
}