export default function StockTile({ stock }) {
  if (stock.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-700">{stock.symbol}</h3>
        <p className="text-red-600 text-sm mt-2">{stock.error}</p>
        {stock.hasIntraday !== undefined && (
          <div className="text-xs text-gray-500 mt-1">
            Intraday: {stock.hasIntraday ? '✓' : '✗'} | EOD: {stock.hasEOD ? '✓' : '✗'}
          </div>
        )}
      </div>
    );
  }

  const isPositive = stock.isPositive;
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const bgColorClass = isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const signPrefix = isPositive ? '+' : '';

  return (
    <div className={`${bgColorClass} border rounded-lg p-4 transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-gray-800">{stock.symbol}</h3>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">
            ${parseFloat(stock.currentPrice).toFixed(2)}
          </div>
          <div className={`text-sm ${colorClass} font-medium`}>
            {signPrefix}${stock.priceChange} ({signPrefix}{stock.percentageChange}%)
          </div>
        </div>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Current Price Time:</span>
          <span className="font-medium text-xs">{stock.currentPriceTime}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Close:</span>
          <span className="font-medium">${parseFloat(stock.lastClosePrice).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Close Date:</span>
          <span className="font-medium">{stock.lastCloseDate}</span>
        </div>
      </div>
    </div>
  );
}