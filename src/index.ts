import * as dotenv from 'dotenv';
import { BackpackAPI } from './api';
import { BackpackCredentials, BackpackFill, BackpackOrder, BackpackFundingPayment, BackpackSettlement, BackpackFundingHistory, BackpackBalance, BackpackDeposit, BackpackWithdrawal, BackpackPosition } from './types';
import { PositionReconstructor, formatPositionForCLI, formatPositionsAsTable, formatPositionsAsDetailedJSON } from './analysis';

dotenv.config();

interface TradingData {
  fills: BackpackFill[];
  orders: BackpackOrder[];
  fundingPayments: BackpackFundingPayment[];
  settlements: BackpackSettlement[];
  fundingHistory: BackpackFundingHistory[];
  balances: BackpackBalance;
  deposits: BackpackDeposit[];
  withdrawals: BackpackWithdrawal[];
  positions: BackpackPosition[];
}

function validateEnvironment(): BackpackCredentials {
  const apiKey = process.env.BACKPACK_API_KEY;
  const privateKey = process.env.BACKPACK_PRIVATE_KEY;

  if (!apiKey || !privateKey) {
    console.error('Error: Missing required environment variables.');
    console.error('Please set BACKPACK_API_KEY and BACKPACK_PRIVATE_KEY in your .env file.');
    console.error('See .env.example for the required format.');
    process.exit(1);
  }

  return { apiKey, privateKey };
}

function filterPerpetualTrades(data: TradingData): TradingData {
  const isPerpSymbol = (symbol: string): boolean => {
    return symbol.includes('PERP') || symbol.includes('_PERP') || symbol.endsWith('-PERP');
  };

  return {
    fills: data.fills.filter(fill => isPerpSymbol(fill.symbol)),
    orders: data.orders.filter(order => isPerpSymbol(order.symbol)),
    fundingPayments: data.fundingPayments.filter(payment => isPerpSymbol(payment.symbol)),
    settlements: data.settlements.filter(settlement => isPerpSymbol(settlement.symbol)),
    fundingHistory: data.fundingHistory.filter(funding => isPerpSymbol(funding.symbol)),
    balances: data.balances, // Keep all balances (not symbol-specific)
    deposits: data.deposits, // Keep all deposits (not symbol-specific)
    withdrawals: data.withdrawals, // Keep all withdrawals (not symbol-specific)
    positions: data.positions, // Keep all positions (already filtered by state=Closed)
  };
}


function displayRawDataAsJSON(data: TradingData): void {
  console.log('\n' + '='.repeat(60));
  console.log('📄 RAW TRADING DATA (JSON)');
  console.log('='.repeat(60));
  console.log(JSON.stringify(data, null, 2));
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting Backpack Exchange historical data fetch...\n');

    const credentials = validateEnvironment();
    const api = new BackpackAPI(credentials);

    console.log('📊 Fetching all historical data...\n');

    console.log('Fetching fills data...');
    const fills = await api.getAllFills();
    
    console.log('Fetching orders data...');
    let orders: BackpackOrder[] = [];
    let fundingPayments: BackpackFundingPayment[] = [];
    let settlements: BackpackSettlement[] = [];
    let fundingHistory: BackpackFundingHistory[] = [];
    let balances: BackpackBalance = {};
    let deposits: BackpackDeposit[] = [];
    let withdrawals: BackpackWithdrawal[] = [];
    let positions: BackpackPosition[] = [];
    
    try {
      orders = await api.getAllOrders();
      console.log('Orders data fetched successfully');
    } catch (error) {
      console.log('Orders endpoint not available');
    }
    
    try {
      fundingPayments = await api.getAllFundingPayments();
      console.log('Funding payments data fetched successfully');
    } catch (error) {
      console.log('Funding payments endpoint not available');
    }
    
    try {
      settlements = await api.getAllSettlements();
      console.log('Settlements data fetched successfully');
    } catch (error) {
      console.log('Settlements endpoint not available');
    }
    
    try {
      fundingHistory = await api.getAllFundingHistory();
      console.log('Funding history data fetched successfully');
    } catch (error) {
      console.log('Funding history endpoint not available');
    }
    
    try {
      balances = await api.getBalances();
      console.log('Balances data fetched successfully');
    } catch (error) {
      console.log('Balances endpoint not available');
    }
    
    try {
      deposits = await api.getAllDeposits();
      console.log('Deposits data fetched successfully');
    } catch (error) {
      console.log('Deposits endpoint not available');
    }
    
    try {
      withdrawals = await api.getAllWithdrawals();
      console.log('Withdrawals data fetched successfully');
    } catch (error) {
      console.log('Withdrawals endpoint not available');
    }
    
    try {
      positions = await api.getAllPositions(0, 'Closed');
      console.log('Positions data fetched successfully');
    } catch (error) {
      console.log('Positions endpoint not available');
    }

    console.log('\n✅ Data fetch completed!\n');

    const allData: TradingData = {
      fills,
      orders,
      fundingPayments,
      settlements,
      fundingHistory,
      balances,
      deposits,
      withdrawals,
      positions,
    };

    console.log('🔍 Filtering for perpetual trades only...\n');
    const perpData = filterPerpetualTrades(allData);

    // Display raw JSON data
    displayRawDataAsJSON(perpData);

    // Display positions from new endpoint
    if (perpData.positions && perpData.positions.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🆕 POSITIONS FROM NEW ENDPOINT');
      console.log('='.repeat(60));
      console.log(JSON.stringify(perpData.positions, null, 2));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('🆕 POSITIONS FROM NEW ENDPOINT');
      console.log('='.repeat(60));
      console.log('No positions found or endpoint not available');
    }

    // Perform position analysis
    console.log('\n' + '='.repeat(60));
    console.log('📊 POSITION ANALYSIS');
    console.log('='.repeat(60));

    const positionAnalysis = PositionReconstructor.reconstructPositions(perpData.fills);

    if (positionAnalysis.completedPositions.length === 0) {
      console.log('\n❌ No completed positions found.');
      console.log('This could mean:');
      console.log('- All positions are still open');
      console.log('- No perpetual trades were found');
      console.log('- Only one-sided trades (no round trips)');
    } else {
      console.log(`\n✅ Found ${positionAnalysis.completedPositions.length} completed position(s):\n`);

      // Display table format (like Backpack UI)
      console.log('📊 POSITIONS TABLE (Backpack UI Format)');
      console.log('='.repeat(60));
      console.log(formatPositionsAsTable(positionAnalysis.completedPositions));

      // Display detailed JSON structure
      console.log('\n' + '='.repeat(60));
      console.log('📄 DETAILED JSON STRUCTURE');
      console.log('='.repeat(60));
      const detailedPositions = formatPositionsAsDetailedJSON(positionAnalysis.completedPositions, perpData.orders);
      console.log(JSON.stringify(detailedPositions, null, 2));

      // Display individual position details
      console.log('\n' + '='.repeat(60));
      console.log('📋 INDIVIDUAL POSITION DETAILS');
      console.log('='.repeat(60));
      positionAnalysis.completedPositions.forEach(position => {
        console.log(formatPositionForCLI(position));
        console.log('\n' + '-'.repeat(50) + '\n');
      });

      // Display summary
      console.log('📈 OVERALL SUMMARY');
      console.log('='.repeat(30));
      console.log(`Total Positions: ${positionAnalysis.summary.totalPositions}`);
      
      const totalPnlColor = positionAnalysis.summary.totalPnl >= 0 ? '32' : '31';
      const totalPnlSign = positionAnalysis.summary.totalPnl >= 0 ? '+' : '';
      console.log(`Net PnL: \x1b[${totalPnlColor}m${totalPnlSign}$${positionAnalysis.summary.totalPnl.toFixed(2)}\x1b[0m`);
      console.log(`Total Fees: $${positionAnalysis.summary.totalFees.toFixed(5)}`);

      console.log('\n📊 BY SYMBOL:');
      Object.entries(positionAnalysis.summary.symbolBreakdown).forEach(([symbol, data]) => {
        const pnlColor = data.pnl >= 0 ? '32' : '31';
        const pnlSign = data.pnl >= 0 ? '+' : '';
        console.log(`${symbol}: ${data.positions} position(s), \x1b[${pnlColor}m${pnlSign}$${data.pnl.toFixed(2)}\x1b[0m PnL`);
      });
    }

    console.log('\n🎉 Analysis completed successfully!');

  } catch (error) {
    console.error('❌ Error fetching data:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      
      if (error.message.includes('401') || error.message.includes('403')) {
        console.error('\nAuthentication failed. Please check your API credentials.');
      } else if (error.message.includes('429')) {
        console.error('\nRate limit exceeded. Please try again later.');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}