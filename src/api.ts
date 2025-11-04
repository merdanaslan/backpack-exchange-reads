import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BackpackAuth } from './auth';
import { 
  BackpackCredentials, 
  BackpackRequestConfig, 
  BackpackFill, 
  BackpackOrder, 
  BackpackFundingPayment, 
  BackpackSettlement,
  HistoryResponse,
  PaginationParams 
} from './types';

export class BackpackAPI {
  private auth: BackpackAuth;
  private client: AxiosInstance;
  private readonly baseURL = 'https://api.backpack.exchange';

  constructor(credentials: BackpackCredentials) {
    this.auth = new BackpackAuth(credentials);
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });
  }

  private async makeRequest<T>(config: BackpackRequestConfig): Promise<T> {
    const timestamp = Date.now();
    const window = 5000;
    
    const headers = this.auth.signRequest(config, timestamp, window);
    
    let url = config.path;
    if (config.params && Object.keys(config.params).length > 0) {
      const params = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      url += `?${params.toString()}`;
    }

    const response: AxiosResponse<T> = await this.client.request({
      method: config.method,
      url,
      headers,
      data: config.body,
    });

    return response.data;
  }

  async getFills(params?: PaginationParams): Promise<BackpackFill[]> {
    const paramsWithSort = {
      ...params,
      sortDirection: 'Asc' as const
    };
    const response = await this.makeRequest<BackpackFill[]>({
      method: 'GET',
      path: '/wapi/v1/history/fills',
      params: paramsWithSort,
    });
    return response;
  }

  async getOrders(params?: PaginationParams): Promise<BackpackOrder[]> {
    const paramsWithSort = {
      ...params,
      sortDirection: 'Asc' as const
    };
    const response = await this.makeRequest<BackpackOrder[]>({
      method: 'GET',
      path: '/wapi/v1/history/orders',
      params: paramsWithSort,
    });
    return response;
  }

  async getFundingPayments(params?: PaginationParams): Promise<BackpackFundingPayment[]> {
    const response = await this.makeRequest<BackpackFundingPayment[]>({
      method: 'GET',
      path: '/wapi/v1/history/fundingPayments',
      params,
    });
    return response;
  }

  async getSettlements(params?: PaginationParams): Promise<BackpackSettlement[]> {
    const response = await this.makeRequest<BackpackSettlement[]>({
      method: 'GET',
      path: '/wapi/v1/history/settlement',
      params,
    });
    return response;
  }

  async getAllFills(): Promise<BackpackFill[]> {
    const allFills: BackpackFill[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      console.log(`Fetching fills with offset ${offset}...`);
      const fills = await this.getFills({ limit, offset });
      
      if (fills.length === 0) {
        break;
      }
      
      allFills.push(...fills);
      
      if (fills.length < limit) {
        break;
      }
      
      offset += limit;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allFills;
  }

  async getAllOrders(): Promise<BackpackOrder[]> {
    const allOrders: BackpackOrder[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      console.log(`Fetching orders with offset ${offset}...`);
      const orders = await this.getOrders({ limit, offset });
      
      if (orders.length === 0) {
        break;
      }
      
      allOrders.push(...orders);
      
      if (orders.length < limit) {
        break;
      }
      
      offset += limit;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allOrders;
  }

  async getAllFundingPayments(): Promise<BackpackFundingPayment[]> {
    const allPayments: BackpackFundingPayment[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      console.log(`Fetching funding payments with offset ${offset}...`);
      const payments = await this.getFundingPayments({ limit, offset });
      
      if (payments.length === 0) {
        break;
      }
      
      allPayments.push(...payments);
      
      if (payments.length < limit) {
        break;
      }
      
      offset += limit;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allPayments;
  }

  async getAllSettlements(): Promise<BackpackSettlement[]> {
    const allSettlements: BackpackSettlement[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      console.log(`Fetching settlements with offset ${offset}...`);
      const settlements = await this.getSettlements({ limit, offset });
      
      if (settlements.length === 0) {
        break;
      }
      
      allSettlements.push(...settlements);
      
      if (settlements.length < limit) {
        break;
      }
      
      offset += limit;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return allSettlements;
  }
}