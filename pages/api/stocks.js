import axios from 'axios';

function getDynamicDateRange() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentHour = now.getHours();

  // GREAT COMMENT
  
  // Calculate how many days back to go to ensure we get recent trading days
  let daysBack = 5; // Default to 5 trading days back
  
  // If it's weekend, go back further
  if (currentDay === 0) { // Sunday
    daysBack = 7;
  } else if (currentDay === 6) { // Saturday
    daysBack = 6;
  }
  
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateTo.getDate() - daysBack);
  
  return {
    dateFrom: dateFrom.toISOString().split('T')[0], // YYYY-MM-DD format
    dateTo: dateTo.toISOString().split('T')[0]
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey } = req.query;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  const stocks = ['TSLA', 'GOOGL', 'AMZN', 'MSFT', 'NFLX', 'META', 'NVDA'];
  const stocksSymbols = stocks.join(',');
  const { dateFrom, dateTo } = getDynamicDateRange();

  try {
    // Call 1: Get current intraday prices for all stocks in single API call
    const intradayResponse = await axios.get('https://api.marketstack.com/v1/intraday/latest', {
      params: {
        access_key: apiKey,
        symbols: stocksSymbols,
        limit: 1
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Call 2: Get recent EOD data for all stocks in single API call
    const eodResponse = await axios.get('https://api.marketstack.com/v1/eod', {
      params: {
        access_key: apiKey,
        symbols: stocksSymbols,
        date_from: dateFrom,
        date_to: dateTo,
        limit: 35 // 7 stocks × 5 trading days = 35 max records
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const stockData = [];
    
    // Process intraday data
    const intradayData = intradayResponse.data?.data || [];
    const eodData = eodResponse.data?.data || [];
    
    // Create maps for quick lookup
    const intradayMap = {};
    intradayData.forEach(item => {
      intradayMap[item.symbol] = item;
    });
    
    // Create map of most recent EOD data for each stock
    const eodMap = {};
    eodData.forEach(item => {
      if (!eodMap[item.symbol] || new Date(item.date) > new Date(eodMap[item.symbol].date)) {
        eodMap[item.symbol] = item;
      }
    });

    // Build response data for each stock
    stocks.forEach(symbol => {
      const intradayStock = intradayMap[symbol];
      const eodStock = eodMap[symbol];
      
      if (intradayStock && eodStock) {
        const currentPrice = parseFloat(intradayStock.last);
        const lastClosePrice = parseFloat(eodStock.close);
        const priceChange = currentPrice - lastClosePrice;
        const percentageChange = ((priceChange / lastClosePrice) * 100).toFixed(2);

        stockData.push({
          symbol: symbol,
          currentPrice: currentPrice.toFixed(2),
          lastClosePrice: lastClosePrice.toFixed(2),
          priceChange: priceChange.toFixed(2),
          percentageChange: percentageChange,
          currentPriceTime: new Date(intradayStock.date).toLocaleString(),
          lastCloseDate: new Date(eodStock.date).toLocaleDateString(),
          isPositive: priceChange >= 0
        });
      } else {
        stockData.push({
          symbol: symbol,
          error: 'Incomplete data available',
          hasIntraday: !!intradayStock,
          hasEOD: !!eodStock
        });
      }
    });

    res.status(200).json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString(),
      dateRange: { dateFrom, dateTo },
      apiCallsUsed: 2
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock data',
      message: error.message
    });
  }
}