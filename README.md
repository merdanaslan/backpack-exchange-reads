# Backpack Exchange Historical Perp Trades Analyzer

A comprehensive TypeScript script to fetch, analyze, and display your historical perpetual trading data from Backpack Exchange with intelligent position reconstruction.

## Features

- **Comprehensive Data Fetching**: Retrieves fills, orders, funding payments, settlements, balances, deposits, withdrawals with automatic pagination
- **Account Analytics**: Complete account settings, configuration, and interest history analysis
- **Interest Categorization**: Separates lending earnings from position-specific interest payments
- **Intelligent Position Reconstruction**: Groups individual fills into logical trading positions using symbol-aware tracking
- **Multi-Symbol Support**: Handles simultaneous trading across multiple perpetual contracts (BTC, ETH, SOL, etc.)
- **Accurate P&L Calculations**: Matches Backpack Exchange UI exactly with proper weighted average pricing
- **Multiple Output Formats**: CLI table view (Backpack-style), detailed JSON export, and individual position analysis
- **Real-Time CLI Display**: No file exports - all data displayed directly in terminal with color-coded P&L
- **Edge Case Handling**: Properly handles partial fills, interleaved trades, and floating-point precision issues

## Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your API credentials:
   ```bash
   cp .env.example .env
   ```
   
4. Edit `.env` and add your Backpack Exchange API credentials:
   ```
   BACKPACK_API_KEY=your_api_key_here
   BACKPACK_PRIVATE_KEY=your_private_key_here
   ```

## Getting API Credentials

1. Go to [Backpack Exchange Settings](https://backpack.exchange/settings/api)
2. Create a new API key
3. Copy both the API key and private key
4. Add them to your `.env` file

## Usage

### Development mode (with TypeScript):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## CLI Output Formats

The script displays data directly in your terminal with comprehensive views:

### 1. Account Information Display
```
👤 ACCOUNT INFORMATION
============================================================
Account Settings:
├─ Auto Borrow Settlements: Enabled
├─ Auto Lend: Enabled
├─ Leverage Limit: 10
├─ Limit Orders: 0
└─ Liquidating: No
```

### 2. Interest History Analysis
```
💰 INTEREST HISTORY
============================================================
Total Interest Records: 15

🏦 BORROW/LEND INTEREST:
1. USDC
   Amount: +0.0000888885
   Interest Rate: 0.0194655
   Date: 11/11/2025, 8:00:00 AM
   Payment Type: Lend

📊 INTEREST SUMMARY:
------------------------------
UnrealizedPnl Total: +0.00000000
BorrowLend Total: +0.00135043
Grand Total: +0.00135043
```

### 3. Positions Table (Backpack UI Style)
```
Trade ID | Symbol        | Size      | Open      | Duration     | Close     | Realized PnL | Leverage | Collateral | Fees
----------------------------------------------------------------------------------------------------------------------
       1 | BTC_USDC_PERP | 0.000370  |  $106235  | 21 seconds   |  $106309  | +$0.03       | N/A      | N/A        | $0.0079
       2 | BTC_USDC_PERP | 0.000370  |  $103593  | 10 mins      |  $103777  | -$0.07       | N/A      | N/A        | $0.0077
```

### 4. Detailed JSON Export
Compatible with other exchange formats, includes comprehensive event arrays and metadata for each position.

### 5. Individual Position Analysis
Detailed breakdown of each position with:
- Entry/exit prices and timestamps
- Duration calculations
- Color-coded P&L display
- Complete fill execution history
- Fee breakdowns

## Data Retrieved

### **Trading Data**
- **Fills**: Your actual trade executions (chronologically sorted)
- **Orders**: Complete order history with status tracking
- **Funding Payments**: Perpetual funding payments received/paid
- **Settlements**: Position settlements and mark price data  

### **Account & Capital Management**
- **Account Settings**: Auto-lend, auto-borrow, leverage limits, liquidation status, fee tiers
- **Balances**: Current account balances across all assets
- **Deposits**: Historical deposit transactions
- **Withdrawals**: Historical withdrawal transactions

### **Interest & Lending Analytics**
- **Borrow/Lend Interest**: USDC lending earnings and borrowing costs (account-level)
- **UnrealizedPnl Interest**: Position-specific interest payments on unrealized P&L
- **Interest Categorization**: Automatic separation of lending income vs trading costs
- **Hourly Interest Tracking**: Comprehensive interest payment history with rates and amounts

## Position Analysis

The script automatically reconstructs your trading positions by:

1. **Symbol-Aware Tracking**: Each perpetual contract (BTC, ETH, SOL, etc.) tracked independently
2. **Chronological Processing**: Fills processed in actual execution order
3. **Round-Trip Detection**: Positions identified when net quantity returns to zero
4. **Accurate P&L**: Calculations match Backpack Exchange UI exactly
5. **Multi-Fill Handling**: Partial fills and complex entries/exits properly grouped

## Rate Limiting

The script includes built-in delays between API calls to respect rate limits.

## API Endpoints Used

### **Trading Data Endpoints**
- `/wapi/v1/history/fills` - Trade execution data (chronologically sorted)
- `/wapi/v1/history/orders` - Order history
- `/wapi/v1/history/fundingPayments` - Funding payment history
- `/wapi/v1/history/settlement` - Settlement data
- `/wapi/v1/history/funding` - Funding rate history

### **Account & Capital Endpoints**
- `/api/v1/account` - Account settings and configuration
- `/api/v1/capital` - Current account balances
- `/wapi/v1/capital/deposits` - Deposit transaction history
- `/wapi/v1/capital/withdrawals` - Withdrawal transaction history

### **Interest & Lending Endpoints**
- `/wapi/v1/history/interest` - Interest payment history (Lend/Borrow/UnrealizedPnl)
  - **Borrow/Lend**: Account-level lending earnings and borrowing costs
  - **UnrealizedPnl**: Position-specific interest on unrealized P&L

## Validation & Accuracy

The position reconstruction algorithm has been extensively tested and validated:

- ✅ **100% P&L Accuracy**: Matches Backpack Exchange UI exactly
- ✅ **Multi-Symbol Trading**: Successfully handles simultaneous positions across 4+ different perpetual contracts  
- ✅ **Complex Position Patterns**: Correctly processes partial fills, interleaved trades, and multiple entry/exit points
- ✅ **Edge Case Handling**: Robust floating-point precision handling and chronological ordering

## Security

- Never commit your `.env` file to version control
- Keep your API keys secure  
- The script only reads data (no trading capabilities)
- Uses proper ED25519 signature authentication

## Algorithm Details

For detailed information about the position reconstruction algorithm, see [ALGORITHM.md](./ALGORITHM.md).