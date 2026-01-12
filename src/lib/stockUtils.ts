import yahooFinanceModule from 'yahoo-finance2';

// The library v3 export might be the class itself depending on environment/upgrade
// We handle both cases to be safe or just follow the error message "Call new YahooFinance() first"
// We cast to any to avoid TS issues if types are mismatched
let yahooFinance: any;

try {
    // @ts-ignore
    yahooFinance = new yahooFinanceModule();
} catch (e) {
    // If it fails (e.g. it is not a constructor), assume it is the instance
    console.log("YahooFinance is not a constructor, using default export as instance");
    yahooFinance = yahooFinanceModule;
}

export interface StockQuote {
    symbol: string;
    regularMarketPrice: number;
    longName?: string;
}

export async function getStockPrice(symbol: string): Promise<StockQuote | null> {
    try {
        const quote = await yahooFinance.quote(symbol);
        return {
            symbol: quote.symbol,
            regularMarketPrice: quote.regularMarketPrice || 0,
            longName: quote.longName,
        };
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        // If error says "Call new YahooFinance() first", we might need to adjust above logic, 
        // but the try-catch block above should handle it if the module export is the class.
        return null;
    }
}

export async function getStockPrices(symbols: string[]) {
    const results = await Promise.all(symbols.map(s => getStockPrice(s)));
    return results.filter((r): r is StockQuote => r !== null);
}
