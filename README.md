# Backpack Exchange Historical Perp Trades Fetcher

A TypeScript script to fetch all your historical perpetual trades from Backpack Exchange.

## Features

- Fetches all historical data with automatic pagination
- Retrieves fills, orders, funding payments, and settlements
- Filters for perpetual trading data only
- Exports data to JSON and CSV formats
- Comprehensive trading summary

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

## Output

The script will create an `output/` directory with three files:
- `perpetual-trading-data-[timestamp].json` - Complete trading data
- `trading-summary-[timestamp].json` - Summary statistics
- `fills-[timestamp].csv` - Trade fills in CSV format

## Data Retrieved

- **Fills**: Your actual trade executions
- **Orders**: All your order history
- **Funding Payments**: Perpetual funding payments received/paid
- **Settlements**: Position settlements

## Rate Limiting

The script includes built-in delays between API calls to respect rate limits.

## Security

- Never commit your `.env` file to version control
- Keep your API keys secure
- The script only reads data (no trading capabilities)