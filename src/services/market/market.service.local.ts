
declare global {
    interface Window {
        cs: typeof marketService;
    }
}

import { storageService } from '../async-storage.service'
import { makeId, saveToStorage } from '../util.service'
import { userService } from '../user'
import { FilterBy, Market, MarketType } from '../../types/market';
import { polyImgs } from '../imgs';

const STORAGE_KEY = 'market'

export const marketService = {
    query,
    getById,
    save,
    remove,
    addMarketMsg
}
window.cs = marketService


async function query(filterBy: FilterBy) {
    var markets: Market[] = await storageService.query(STORAGE_KEY)
    const { txt, sortField, sortDir } = filterBy

    if (txt) {
        const regex = new RegExp(filterBy.txt, 'i')
        markets = markets.filter(market => regex.test(market.title) || regex.test(market.description))
    }
    // if (minSpeed) {
    //     markets = markets.filter(market => market.speed >= minSpeed)
    // }
    // if (sortField === 'vendor') {
    //     markets.sort((market1, market2) =>
    //         market1[sortField].localeCompare(market2[sortField]) * +sortDir)
    // }
    // if (sortField === 'speed') {
    //     markets.sort((market1, market2) =>
    //         (market1[sortField] - market2[sortField]) * +sortDir)
    // }

    return markets
}

function getById(marketId: string): Promise<Market> {
    return storageService.get(STORAGE_KEY, marketId)
}

async function remove(marketId: string) {
    // throw new Error('Nope')
    await storageService.remove(STORAGE_KEY, marketId)
}

function save(market: Market) {
    if (market._id) {
        return storageService.put(STORAGE_KEY, market)
    } else {
        return storageService.post(STORAGE_KEY, market)
    }
}

async function addMarketMsg(marketId: string, txt: string) {
    // Later, this is all done by the backend
    const market = await getById(marketId)

    const msg = {
        id: makeId(),
        by: userService.getLoggedinUser(),
        txt
    }
    market.msgs.push(msg)
    await storageService.put(STORAGE_KEY, market)

    return msg
}

// Demo data import { Market, FilterBy } from '../../types/market'


const categories = [
    "Politics", "Sports", "Crypto", "Finance", "Geopolitics",
    "Earnings", "Tech", "Culture", "World", "Economy",
    "Climate-science", "Mentions"
]

interface PolyRawMarket {
    id: string;
    question: string;
    image?: string;
    outcomes: string | string[];
    outcomePrices: string | string[];
    endDate: string;
    description?: string;
    tags?: { label: string }[] | string[];
    createdAt: string;
}

function _getMarketType(m: any): Market['type'] {
    const question = (m.question || "").toLowerCase();
    let outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
    const outcomesList = Array.isArray(outcomes) ? outcomes : [];

    if (outcomesList.length === 2 && outcomesList.includes('Yes')) return 'binary';
    if (question.includes('price') || question.includes('up or down')) return 'up-down';
    if (m.tags?.some((t: any) => (typeof t === 'string' ? t : t.label) === 'Sports')) return 'sports';
    if (outcomesList.length > 2) return 'multi';

    return 'binary';
}

export async function fetchDiversePolymarketData(): Promise<Market[]> {
    try {
        // 1. 100 הכי חמים לפי Volume
        const topMarketsPromise = fetch('/poly-api/markets?active=true&closed=false&limit=100&order=volume&ascending=false')
            .then(res => res.ok ? res.json() : []);

        // 2. 50 מכל קטגוריה
        const categoryPromises = categories.map(category =>
            fetch(`/poly-api/markets?active=true&closed=false&limit=50&tag=${category}`)
                .then(res => res.ok ? res.json() : [])
                .catch(() => [])
        );

        const [topMarkets, ...categoryResults] = await Promise.all([topMarketsPromise, ...categoryPromises]);

        const combined: PolyRawMarket[] = [...topMarkets, ...categoryResults.flat()];

        if (!combined.length) return [];

        // 3. הסרת כפילויות לפי ID
        const uniqueMap = new Map<string, PolyRawMarket>();
        combined.forEach(m => {
            if (m?.id) uniqueMap.set(m.id, m);
        });
        const uniqueRawMarkets = Array.from(uniqueMap.values());

        console.log(`Found ${uniqueRawMarkets.length} unique markets`);
        console.log(uniqueRawMarkets)
        return uniqueRawMarkets.map(m => {
            // נירמול Outcomes
            let outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
            if (!Array.isArray(outcomes)) outcomes = ["Yes", "No"];

            // נירמול מחירים
            let rawPrices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;
            const prices = Array.isArray(rawPrices)
                ? rawPrices.map(p => Math.round(parseFloat(p) * 100))
                : outcomes.map(() => 50);

            // בניית Options
            let options: any;
            if (outcomes.length === 2 && (outcomes.includes("Yes") || outcomes.includes("No"))) {
                options = {
                    [outcomes[0]]: prices[0] ?? 50,
                    [outcomes[1]]: prices[1] ?? 50
                };
            } else {
                options = outcomes.map((outcome: string, idx: number) => ({
                    id: `${m.id}-${idx}`,
                    subtitle: outcome,
                    yesShares: prices[idx] ?? 0,
                    noShares: 100 - (prices[idx] ?? 0)
                }));
            }

            // תגים – המרה בטוחה לכל מבנה
            const marketTags: string[] = Array.isArray(m.tags)
                ? m.tags.map(t => (typeof t === 'string' ? t : t.label)).filter(Boolean)
                : [];

            // קטגוריה ראשית מתוך הרשימה שלך
            const primaryCat = categories.find(c => marketTags.includes(c)) ?? marketTags[0] ?? 'General';

            // בניית labels סופית ללא כפילויות
            const labels = Array.from(new Set([primaryCat, ...marketTags]));

            return {
                _id: m.id,
                title: m.question,
                type: _getMarketType(m),
                imgUrl: m.image || polyImgs[Math.floor(Math.random() * polyImgs.length)],
                status: 'open',
                options,
                endDate: new Date(m.endDate).getTime(),
                description: m.description || "",
                labels, // ✅ עכשיו תמיד יהיו
                msgs: [],
                createdAt: new Date(m.createdAt)
            } as Market;
        }).sort(() => Math.random() - 0.5);

    } catch (err) {
        console.error("Fetch failed:", err);
        return [];
    }
}

// שימוש
const demoMarkets = await fetchDiversePolymarketData();
console.log(demoMarkets)
saveToStorage(STORAGE_KEY, demoMarkets)