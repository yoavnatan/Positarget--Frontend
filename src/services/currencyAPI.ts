import axios from 'axios';

interface CacheEntry {
    rate: number;
    timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TIME = 1000 * 60 * 10; // 10 דקות


export async function convertToUsdc(coin: string, amount: number): Promise<number> {
    const symbol = coin.toUpperCase();
    const now = Date.now();
    const cachedItem = cache[symbol];



    if (amount === 0) return 0;

    if (cachedItem && (now - cachedItem.timestamp < CACHE_TIME)) {
        return amount * cachedItem.rate;
    }

    try {
        const response = await axios.get(
            `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USDC`
        );

        const rate = response.data.USDC;

        if (!rate || typeof rate !== 'number') {
            throw new Error(`Invalid rate received for ${symbol}`);
        }

        // 3. עדכון ה-Cache הספציפי למטבע זה
        cache[symbol] = {
            rate: rate,
            timestamp: now
        };

        return amount * rate;

    } catch (error) {
        console.error(`Rate fetch failed for ${symbol}:`, error);

        const fallbackRate = cache[symbol]?.rate || 0;
        return amount * fallbackRate;
    }
}