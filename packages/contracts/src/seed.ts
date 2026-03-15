export const ASSETS_SEED: Array<{
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'commodity';
  basePrice: number;
  baseVolatility: 'low' | 'medium' | 'high';
}> = [
  // Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', basePrice: 189.50, baseVolatility: 'low' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', basePrice: 415.20, baseVolatility: 'low' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', basePrice: 175.80, baseVolatility: 'low' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', basePrice: 205.60, baseVolatility: 'medium' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', basePrice: 875.30, baseVolatility: 'high' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', basePrice: 248.90, baseVolatility: 'high' },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock', basePrice: 535.40, baseVolatility: 'medium' },
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', basePrice: 198.70, baseVolatility: 'low' },
  { symbol: 'V', name: 'Visa Inc.', type: 'stock', basePrice: 282.30, baseVolatility: 'low' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', basePrice: 156.80, baseVolatility: 'low' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'stock', basePrice: 172.40, baseVolatility: 'low' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'stock', basePrice: 165.20, baseVolatility: 'low' },
  { symbol: 'XOM', name: 'Exxon Mobil', type: 'stock', basePrice: 104.50, baseVolatility: 'medium' },
  { symbol: 'BAC', name: 'Bank of America', type: 'stock', basePrice: 37.20, baseVolatility: 'medium' },
  { symbol: 'DIS', name: 'Walt Disney', type: 'stock', basePrice: 112.60, baseVolatility: 'medium' },

  // Crypto
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', basePrice: 68500.00, baseVolatility: 'high' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', basePrice: 3850.00, baseVolatility: 'high' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', basePrice: 185.40, baseVolatility: 'high' },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', basePrice: 0.62, baseVolatility: 'high' },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto', basePrice: 8.45, baseVolatility: 'high' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto', basePrice: 42.30, baseVolatility: 'high' },
  { symbol: 'LINK', name: 'Chainlink', type: 'crypto', basePrice: 18.75, baseVolatility: 'high' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', basePrice: 0.165, baseVolatility: 'high' },

  // Forex
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', basePrice: 1.0845, baseVolatility: 'low' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex', basePrice: 1.2680, baseVolatility: 'low' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'forex', basePrice: 151.20, baseVolatility: 'medium' },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', type: 'forex', basePrice: 0.8825, baseVolatility: 'low' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', type: 'forex', basePrice: 0.6540, baseVolatility: 'medium' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', type: 'forex', basePrice: 1.3565, baseVolatility: 'low' },

  // Commodities
  { symbol: 'GOLD', name: 'Gold', type: 'commodity', basePrice: 2165.80, baseVolatility: 'medium' },
  { symbol: 'SILVER', name: 'Silver', type: 'commodity', basePrice: 24.85, baseVolatility: 'medium' },
  { symbol: 'OIL', name: 'Crude Oil WTI', type: 'commodity', basePrice: 78.40, baseVolatility: 'high' },
  { symbol: 'NATGAS', name: 'Natural Gas', type: 'commodity', basePrice: 1.82, baseVolatility: 'high' },
  { symbol: 'COPPER', name: 'Copper', type: 'commodity', basePrice: 3.95, baseVolatility: 'medium' },
  { symbol: 'WHEAT', name: 'Wheat', type: 'commodity', basePrice: 5.68, baseVolatility: 'medium' },
];

export const SCENARIOS: Array<{
  type: string;
  label: string;
  description: string;
  durationMs: number;
  affectedTypes: string[];
  priceMultiplier: number;
}> = [
  {
    type: 'tech-selloff',
    label: 'Tech Selloff',
    description: 'Major tech stocks experience heavy selling pressure',
    durationMs: 30000,
    affectedTypes: ['stock'],
    priceMultiplier: -3.5,
  },
  {
    type: 'crypto-rally',
    label: 'Crypto Rally',
    description: 'Cryptocurrency market surges across the board',
    durationMs: 30000,
    affectedTypes: ['crypto'],
    priceMultiplier: 5.0,
  },
  {
    type: 'flash-crash',
    label: 'Flash Crash',
    description: 'Sudden market-wide crash across all asset classes',
    durationMs: 15000,
    affectedTypes: ['stock', 'crypto', 'forex', 'commodity'],
    priceMultiplier: -8.0,
  },
  {
    type: 'volume-burst',
    label: 'Volume Burst',
    description: 'Unusual trading volume across markets',
    durationMs: 20000,
    affectedTypes: ['stock', 'crypto'],
    priceMultiplier: 1.5,
  },
  {
    type: 'forex-shock',
    label: 'Forex Shock',
    description: 'Major currency pairs experience extreme volatility',
    durationMs: 25000,
    affectedTypes: ['forex'],
    priceMultiplier: -4.0,
  },
  {
    type: 'commodity-surge',
    label: 'Commodity Surge',
    description: 'Commodity prices spike on supply concerns',
    durationMs: 30000,
    affectedTypes: ['commodity'],
    priceMultiplier: 4.5,
  },
];
