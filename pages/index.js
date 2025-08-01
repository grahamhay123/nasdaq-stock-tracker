import { useState, useEffect } from 'react';
import StockTile from '../components/StockTile';

export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('marketstack_api_key');
    const savedAuth = localStorage.getItem('app_authenticated');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('app_authenticated', 'true');
        setError('');
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      setError('Authentication failed');
    }
  };

  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('marketstack_api_key', key);
  };

  const fetchStockData = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Marketstack API key');
      return;
    }

    setLoading(true);
    setError('');
    setStockData([]);
    setProgress({ current: 0, total: 7 });

    try {
      const response = await fetch('/api/stocks', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setStockData(result.data);
        setLastUpdate(new Date(result.timestamp).toLocaleString());
      } else {
        setError(result.error || 'Failed to fetch stock data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
            NASDAQ Stock Tracker
          </h1>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to access app"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Access App
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              NASDAQ Stock Tracker
            </h1>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                localStorage.removeItem('app_authenticated');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Logout
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Marketstack API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your Marketstack API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchStockData}
                disabled={loading || !apiKey.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Fetching...' : 'Fetch Stock Data'}
              </button>
            </div>

            {loading && progress.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Loading stock data...</span>
                  <span>{progress.current}/{progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {lastUpdate && (
              <div className="mt-4 text-sm text-gray-600">
                Last updated: {lastUpdate}
              </div>
            )}
          </div>

          {stockData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stockData.map((stock, index) => (
                <StockTile key={stock.symbol || index} stock={stock} />
              ))}
            </div>
          )}

          {!loading && stockData.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Enter your API key and click "Fetch Stock Data" to see the latest NASDAQ stock prices
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}