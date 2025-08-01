import axios from 'axios';

function getDynamicDateRange() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentHour = now.getHours();

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
  // CORS headers are now handled in next.config.js with restricted origins for production
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security improvement: Get API key from header instead of query parameter
  // This prevents API key from being logged in server logs
  const apiKey = req.headers['x-api-key'] || process.env.ALPHAVANTAGE_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'API key is required. Please provide it via X-API-Key header or set ALPHAVANTAGE_API_KEY environment variable.' 
    });
  }

  const stocks = ['TSLA', 'GOOGL', 'AMZN', 'MSFT', 'NFLX', 'META', 'NVDA'];
  const stockData = [];

  try {
    // Alpha Vantage rate limit: 5 requests per minute (12 seconds between calls)
    const RATE_LIMIT_DELAY = 12000; // 12 seconds in milliseconds
    
    for (let i = 0; i < stocks.length; i++) {
      const symbol = stocks[i];
      
      try {
        // Add delay between API calls (except for the first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }

        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: apiKey
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000 // 30 second timeout
        });

        const quote = response.data['Global Quote'];
        
        if (quote && Object.keys(quote).length > 0) {
          // Alpha Vantage Global Quote API response keys
          const symbol = quote['01. symbol'];
          const currentPrice = parseFloat(quote['05. price']);
          const lastClosePrice = parseFloat(quote['08. previous close']);
          const priceChange = parseFloat(quote['09. change']);
          const percentageChange = parseFloat(quote['10. change percent'].replace('%', ''));
          const tradingDay = quote['07. latest trading day'];
          
          // Validate that we have valid data
          if (symbol && !isNaN(currentPrice) && !isNaN(lastClosePrice) && tradingDay) {
            // Parse the date properly to avoid timezone issues
            const tradingDate = new Date(tradingDay + 'T00:00:00');
            
            stockData.push({
              symbol: symbol,
              currentPrice: currentPrice.toFixed(2),
              lastClosePrice: lastClosePrice.toFixed(2),
              priceChange: priceChange.toFixed(2),
              percentageChange: percentageChange.toFixed(2),
              currentPriceTime: `${tradingDate.toLocaleDateString('en-GB')} (Last Trading Day)`,
              lastCloseDate: tradingDate.toLocaleDateString('en-GB'),
              isPositive: priceChange >= 0
            });
          } else {
            stockData.push({
              symbol: symbol || 'Unknown',
              error: 'Invalid data received from Alpha Vantage',
              details: 'Missing required price or date information'
            });
          }
        } else {
          // Check if this is an API limit response
          if (response.data && response.data['Note'] && response.data['Note'].includes('API call frequency')) {
            stockData.push({
              symbol: symbol,
              error: 'API Rate Limit Exceeded',
              details: 'Alpha Vantage API call frequency limit reached. Please wait before making more requests.'
            });
          } else {
            stockData.push({
              symbol: symbol,
              error: 'No data available from Alpha Vantage',
              details: 'API response missing Global Quote data'
            });
          }
        }
      } catch (stockError) {
        console.error(`Error fetching ${symbol}:`, stockError.message);
        let errorMessage = 'Failed to fetch stock data';
        let errorDetails = stockError.message;
        
        // Handle specific error cases
        if (stockError.response?.status === 403) {
          errorMessage = 'Invalid API Key';
          errorDetails = 'Please check your Alpha Vantage API key';
        } else if (stockError.code === 'ECONNABORTED') {
          errorMessage = 'Request Timeout';
          errorDetails = 'API request took too long to respond';
        }
        
        stockData.push({
          symbol: symbol,
          error: errorMessage,
          details: errorDetails
        });
      }
    }

    res.status(200).json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString(),
      apiCallsUsed: stocks.length,
      provider: 'Alpha Vantage',
      processingTime: `~${Math.ceil(stocks.length * RATE_LIMIT_DELAY / 1000)} seconds`
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