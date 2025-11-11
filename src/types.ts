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

export interface BackpackFundingHistory {
  userId: number;
  subaccountId: number;
  symbol: string;
  quantity: string;
  intervalEndTimestamp: string;
  fundingRate: string;
}

export interface BackpackBalance {
  [symbol: string]: {
    available: string;
    locked: string;
    staked: string;
  };
}

export interface BackpackDeposit {
  id?: string;
  transactionId?: string;
  fromAddress?: string;
  toAddress?: string;
  status: string;
  symbol: string;
  quantity: string;
  timestamp: number;
  fiatValue?: string;
  fiatCurrency?: string;
}

export interface BackpackWithdrawal {
  id?: string;
  blockchain: string;
  quantity: string;
  fee?: string;
  status: string;
  address: string;
  transactionHash?: string;
  timestamp: number;
  symbol: string;
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

export interface BackpackPosition {
  // Basic structure - will update based on actual response
  [key: string]: any;
}

export interface BackpackAccount {
  autoBorrowSettlements?: boolean;
  autoLend?: boolean;
  leverageLimit?: string;
  limitOrders?: number;
  liquidating?: boolean;
  // Add other account fields as they're discovered from API
  [key: string]: any;
}

export interface BackpackInterestHistory {
  interestRate: string;
  interval: number;
  marketSymbol: string;
  paymentType: 'Lend' | 'Borrow' | 'UnrealizedPnl' | string; // Actual payment types from API
  positionId: string;
  quantity: string; // This is the interest amount earned
  symbol: string;
  timestamp: string;
  // Add other fields as discovered from API
  [key: string]: any;
}