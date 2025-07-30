import axios from 'axios';

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
  const stockData = [];

  try {
    for (let i = 0; i < stocks.length; i++) {
      const symbol = stocks[i];
      
      try {
        const response = await axios.get('http://api.marketstack.com/v1/eod/latest', {
          params: {
            access_key: apiKey,
            symbols: symbol,
            limit: 1
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
          const data = response.data.data[0];
          const priceChange = data.close - data.open;
          const percentageChange = ((priceChange / data.open) * 100).toFixed(2);

          stockData.push({
            symbol: data.symbol,
            currentPrice: data.close,
            openPrice: data.open,
            priceChange: priceChange.toFixed(2),
            percentageChange: percentageChange,
            lastUpdate: new Date(data.date).toLocaleDateString(),
            isPositive: priceChange >= 0
          });
        } else {
          stockData.push({
            symbol: symbol,
            error: 'No data available'
          });
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error.message);
        stockData.push({
          symbol: symbol,
          error: `Failed to fetch data: ${error.message}`
        });
      }

      if (i < stocks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
    }

    res.status(200).json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
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