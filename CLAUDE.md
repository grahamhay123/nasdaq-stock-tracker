# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Application Architecture

This is a Next.js application that provides password-protected real-time stock tracking for major NASDAQ companies.

### Authentication Flow
- Environment variable `APP_PASSWORD` controls access (pages/api/auth.js)
- Client-side authentication state stored in localStorage
- Users must authenticate before accessing the main application

### API Integration Pattern
- Marketstack API integration uses user-provided API keys (never hardcoded)
- API keys are stored in client-side localStorage for convenience
- Stock data fetching optimized to use only 2 API calls for 7 stocks:
  1. Batch intraday data call for current prices
  2. Batch EOD data call for comparison prices
- API calls include User-Agent headers and proper error handling

### Data Flow
1. User enters API key in UI (pages/index.js:147-154)
2. Frontend calls `/api/stocks` with API key as query parameter
3. Backend makes batch API calls to Marketstack (pages/api/stocks.js:54-77)
4. Data is processed and formatted for display (pages/api/stocks.js:99-128)
5. StockTile components render individual stock data with color-coded changes

### Stock Data Structure
The application tracks these specific stocks: TSLA, GOOGL, AMZN, MSFT, NFLX, META, NVDA

Each stock object contains:
- Current price and timestamp
- Last close price and date
- Price change (absolute and percentage)
- Positive/negative indicator for styling

### Styling System
- Tailwind CSS for utility-first styling
- Responsive grid layout (1-4 columns based on screen size)
- Color-coded tiles: green for gains, red for losses
- Custom PostCSS configuration with autoprefixer

### Environment Variables
Required:
- `APP_PASSWORD`: Password for application access

Optional (commented in .env.example):
- `MARKETSTACK_API_KEY`: Can be set but users are encouraged to enter via UI for security

### Next.js Configuration
- React Strict Mode enabled
- CORS headers configured for API routes
- Standard Tailwind/PostCSS setup