import { BackpackFill, BackpackOrder } from './types';

export interface CompletedPosition {
  id: number;
  symbol: string;
  side: 'Long' | 'Short';
  size: number;
  notionalValue: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  duration: string;
  realizedPnl: number;
  realizedPnlPercent: number;
  totalFees: number;
  leverage: string; // "N/A" for historical positions
  collateral: string; // "N/A" for historical positions
  fills: BackpackFill[];
}

interface SymbolPosition {
  symbol: string;
  netQuantity: number;
  openFills: BackpackFill[];
  completedPositions: CompletedPosition[];
}

export interface PositionAnalysis {
  completedPositions: CompletedPosition[];
  summary: {
    totalPositions: number;
    totalPnl: number;
    totalFees: number;
    symbolBreakdown: { [symbol: string]: { positions: number; pnl: number } };
  };
}

export class PositionReconstructor {
  private static readonly EPSILON = 0.0000001;

  static reconstructPositions(fills: BackpackFill[]): PositionAnalysis {
    // Sort fills by timestamp (ascending - chronological order)
    const sortedFills = [...fills].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Track position per symbol
    const symbolPositions = new Map<string, SymbolPosition>();
    let positionIdCounter = 1;

    for (const fill of sortedFills) {
      const { symbol } = fill;

      // Initialize symbol tracking if needed
      if (!symbolPositions.has(symbol)) {
        symbolPositions.set(symbol, {
          symbol,
          netQuantity: 0,
          openFills: [],
          completedPositions: []
        });
      }

      const position = symbolPositions.get(symbol)!;

      // Add fill to current position
      position.openFills.push(fill);

      // Update net quantity for this symbol
      const quantity = parseFloat(fill.quantity);
      if (fill.side === 'Bid') {
        position.netQuantity += quantity; // Buy increases position
      } else if (fill.side === 'Ask') {
        position.netQuantity -= quantity; // Sell decreases position
      }

      // Check if position is closed (back to zero with floating point tolerance)
      if (Math.abs(position.netQuantity) < this.EPSILON) {
        // Position complete for this symbol!
        const completedPosition = this.createCompletedPosition(
          positionIdCounter++,
          position.openFills
        );
        
        if (completedPosition) {
          position.completedPositions.push(completedPosition);
        }

        // Reset for next position
        position.openFills = [];
        position.netQuantity = 0;
      }
    }

    // Collect all completed positions from all symbols
    const allPositions: CompletedPosition[] = [];
    const symbolBreakdown: { [symbol: string]: { positions: number; pnl: number } } = {};

    for (const [symbol, pos] of symbolPositions) {
      allPositions.push(...pos.completedPositions);
      
      symbolBreakdown[symbol] = {
        positions: pos.completedPositions.length,
        pnl: pos.completedPositions.reduce((sum, p) => sum + p.realizedPnl, 0)
      };
    }

    // Sort by entry time
    allPositions.sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());

    const summary = {
      totalPositions: allPositions.length,
      totalPnl: allPositions.reduce((sum, pos) => sum + pos.realizedPnl, 0),
      totalFees: allPositions.reduce((sum, pos) => sum + pos.totalFees, 0),
      symbolBreakdown
    };

    return {
      completedPositions: allPositions,
      summary
    };
  }

  private static createCompletedPosition(
    id: number, 
    fills: BackpackFill[]
  ): CompletedPosition | null {
    if (fills.length === 0) return null;

    const symbol = fills[0].symbol;
    
    // Simple approach: for a round trip position, 
    // the first fill determines the direction, last fill closes it
    const firstFill = fills[0];
    const isLongPosition = firstFill.side === 'Bid';
    const side: 'Long' | 'Short' = isLongPosition ? 'Long' : 'Short';
    
    // Calculate the actual PnL using FIFO matching
    let totalBuyValue = 0;
    let totalSellValue = 0;
    let totalBuyQuantity = 0;
    let totalSellQuantity = 0;
    let totalFees = 0;
    let entryTime: Date | null = null;
    let exitTime: Date | null = null;
    
    for (const fill of fills) {
      const price = parseFloat(fill.price);
      const quantity = parseFloat(fill.quantity);
      const fee = parseFloat(fill.fee);
      const timestamp = new Date(fill.timestamp);
      
      totalFees += fee;
      
      if (fill.side === 'Bid') {
        // Buy
        totalBuyValue += price * quantity;
        totalBuyQuantity += quantity;
        if (!entryTime || (isLongPosition && (!entryTime || timestamp < entryTime))) {
          entryTime = timestamp;
        }
        if (!isLongPosition) {
          exitTime = timestamp;
        }
      } else {
        // Sell  
        totalSellValue += price * quantity;
        totalSellQuantity += quantity;
        if (!entryTime || (!isLongPosition && (!entryTime || timestamp < entryTime))) {
          entryTime = timestamp;
        }
        if (isLongPosition) {
          exitTime = timestamp;
        }
      }
    }
    
    // Calculate average prices
    const avgBuyPrice = totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;
    const avgSellPrice = totalSellQuantity > 0 ? totalSellValue / totalSellQuantity : 0;
    
    // Position size is the quantity traded
    const size = Math.min(totalBuyQuantity, totalSellQuantity);
    
    // Determine entry and exit prices based on position type
    let entryPrice: number;
    let exitPrice: number;
    let notionalValue: number;
    let realizedPnl: number;
    
    if (isLongPosition) {
      // Long position: bought first, sold later
      entryPrice = avgBuyPrice;
      exitPrice = avgSellPrice;
      notionalValue = size * entryPrice;
      realizedPnl = (exitPrice - entryPrice) * size;
    } else {
      // Short position: sold first, bought later
      entryPrice = avgSellPrice;
      exitPrice = avgBuyPrice;
      notionalValue = size * entryPrice;
      realizedPnl = (entryPrice - exitPrice) * size;
    }
    
    // Note: Fees are tracked separately, not subtracted from PnL (matches Backpack)
    
    // Calculate percentage
    const realizedPnlPercent = notionalValue > 0 ? (realizedPnl / notionalValue) * 100 : 0;
    
    // Calculate duration
    const duration = entryTime && exitTime ? 
      this.formatDuration(exitTime.getTime() - entryTime.getTime()) : 
      'Unknown';

    return {
      id,
      symbol,
      side,
      size,
      notionalValue,
      entryPrice,
      exitPrice,
      entryTime: entryTime || new Date(),
      exitTime: exitTime || new Date(),
      duration,
      realizedPnl,
      realizedPnlPercent,
      totalFees,
      leverage: 'N/A', // No historical leverage data available from API
      collateral: 'N/A', // No historical collateral data available from API
      fills
    };
  }

  private static calculateWeightedAveragePrice(fills: BackpackFill[]): number {
    if (fills.length === 0) return 0;

    let totalValue = 0;
    let totalQuantity = 0;

    for (const fill of fills) {
      const price = parseFloat(fill.price);
      const quantity = parseFloat(fill.quantity);
      totalValue += price * quantity;
      totalQuantity += quantity;
    }

    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  private static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} min${minutes % 60 !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      return `${minutes} min${minutes > 1 ? 's' : ''} ${seconds % 60} sec${seconds % 60 !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

export function formatPositionForCLI(position: CompletedPosition): string {
  const pnlColor = position.realizedPnl >= 0 ? '32' : '31'; // Green for profit, red for loss
  const pnlSign = position.realizedPnl >= 0 ? '+' : '';
  
  return `
Position #${position.id} - ${position.symbol}
├─ Side: ${position.side}
├─ Size: ${position.size.toFixed(8)} ${position.symbol.split('_')[0]} ($${position.notionalValue.toFixed(2)})
├─ Entry: $${position.entryPrice.toFixed(2)} (${position.entryTime.toLocaleString()})
├─ Exit: $${position.exitPrice.toFixed(2)} (${position.exitTime.toLocaleString()})
├─ Duration: ${position.duration}
├─ Realized PnL: \x1b[${pnlColor}m${pnlSign}$${position.realizedPnl.toFixed(2)} (${pnlSign}${position.realizedPnlPercent.toFixed(2)}%)\x1b[0m
├─ Leverage: ${position.leverage}
├─ Collateral: ${position.collateral}
└─ Total Fees: $${position.totalFees.toFixed(5)}

Executions (${position.fills.length} fills):
${position.fills.map((fill, i) => 
  `  ${i + 1}. ${fill.side === 'Bid' ? 'Buy' : 'Sell'} ${fill.quantity} at $${fill.price} (fee: $${fill.fee})`
).join('\n')}`;
}

export function formatPositionsAsTable(positions: CompletedPosition[]): string {
  if (positions.length === 0) return 'No positions to display.';
  
  const header = 'Trade ID | Symbol        | Size      | Open      | Duration     | Close     | Realized PnL | Leverage | Collateral | Fees';
  const separator = '-'.repeat(header.length);
  
  const rows = positions.map(position => {
    const pnlSign = position.realizedPnl >= 0 ? '+' : '';
    const pnlColor = position.realizedPnl >= 0 ? '32' : '31';
    const formattedPnl = `\x1b[${pnlColor}m${pnlSign}$${position.realizedPnl.toFixed(2)}\x1b[0m`;
    
    return [
      position.id.toString().padStart(8),
      position.symbol.padEnd(13),
      position.size.toFixed(6).padStart(9),
      `$${position.entryPrice.toFixed(2)}`.padStart(9),
      position.duration.padEnd(12),
      `$${position.exitPrice.toFixed(2)}`.padStart(9),
      formattedPnl.padEnd(12),
      position.leverage.padEnd(8),
      position.collateral.padEnd(10),
      `$${position.totalFees.toFixed(4)}`.padStart(8)
    ].join(' | ');
  });
  
  return [header, separator, ...rows].join('\n');
}

interface DetailedPositionEvent {
  timestamp: string;
  transaction_signature: string; // Using order_id as closest equivalent
  event_name: string;
  action: 'Buy' | 'Sell';
  type: 'Market' | 'Limit';
  size_usd: number;
  price: number;
  fee_usd: number;
  position_fee_usd?: number;
  funding_fee_usd?: number;
  price_impact_fee_usd?: number;
  trade_id?: string;
  order_id?: string;
}

interface DetailedPosition {
  trade_id: string;
  position_key: string; // N/A for Backpack
  symbol: string;
  direction: 'long' | 'short';
  status: 'closed' | 'active';
  collateral_token: string;
  size_usd: number;
  notional_size: number;
  collateral_usd: string; // N/A for historical positions
  leverage: string; // N/A for historical positions
  entry_price: number;
  exit_price: number;
  realized_pnl: number;
  realized_pnl_percent: number;
  total_fees: number;
  has_profit: boolean;
  entry_time: string;
  exit_time: string;
  events: DetailedPositionEvent[];
}

function extractCollateralToken(symbol: string): string {
  // Extract base token from symbol like "BTC_USDC_PERP" -> "BTC"
  return symbol.split('_')[0];
}

function getOrderType(fill: BackpackFill, orders: BackpackOrder[]): 'Market' | 'Limit' {
  // Find the corresponding order to determine type
  const order = orders?.find(o => o.id === fill.orderId);
  return order?.orderType === 'Limit' ? 'Limit' : 'Market';
}

export function formatPositionsAsDetailedJSON(positions: CompletedPosition[], orders: BackpackOrder[] = []): DetailedPosition[] {
  return positions.map(position => {
    // Use first fill's tradeId as the trade_id
    const firstFill = position.fills[0];
    const trade_id = firstFill.tradeId.toString();
    
    // Extract collateral token
    const collateral_token = extractCollateralToken(position.symbol);
    
    // Calculate size_usd and notional_size
    const size_usd = position.notionalValue;
    const notional_size = position.size;
    
    // Determine if position has profit
    const has_profit = position.realizedPnl >= 0;
    
    // Map fills to events
    const events: DetailedPositionEvent[] = position.fills.map((fill) => {
      const fillPrice = parseFloat(fill.price);
      const fillQuantity = parseFloat(fill.quantity);
      const fillFee = parseFloat(fill.fee);
      const action = fill.side === 'Bid' ? 'Buy' : 'Sell';
      const orderType = getOrderType(fill, orders);
      
      return {
        timestamp: new Date(fill.timestamp).toISOString(),
        transaction_signature: fill.orderId, // Using order_id as closest equivalent to transaction signature
        event_name: action === 'Buy' ? 'InstantIncreasePositionEvent' : 'InstantDecreasePositionEvent',
        action,
        type: orderType,
        size_usd: fillPrice * fillQuantity,
        price: fillPrice,
        fee_usd: fillFee,
        position_fee_usd: fillFee, // All fee considered as position fee for now
        funding_fee_usd: 0, // TODO: Calculate from funding endpoint
        price_impact_fee_usd: 0, // Not available in Backpack API
        trade_id: fill.tradeId.toString(),
        order_id: fill.orderId
      };
    });

    return {
      trade_id,
      position_key: 'N/A', // Exchange-specific field
      symbol: position.symbol,
      direction: position.side.toLowerCase() as 'long' | 'short',
      status: 'closed' as const,
      collateral_token,
      size_usd,
      notional_size,
      collateral_usd: 'N/A', // No historical collateral data available from API
      leverage: 'N/A', // No historical leverage data available from API
      entry_price: position.entryPrice,
      exit_price: position.exitPrice,
      realized_pnl: position.realizedPnl,
      realized_pnl_percent: position.realizedPnlPercent,
      total_fees: position.totalFees,
      has_profit,
      entry_time: position.entryTime.toISOString(),
      exit_time: position.exitTime.toISOString(),
      events
    };
  });
}