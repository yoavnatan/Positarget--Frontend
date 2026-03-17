
declare global {
    interface Window {
        cs: typeof eventService;
    }
}

import { storageService } from '../async-storage.service'
import { makeId, saveToStorage } from '../util.service'
import { userService } from '../user'
import { FilterBy, Event, Market, EventComment, OrderbookLevel, Orderbook, PolyOrderbookResponse, PolyOrderbookLevel, Msg } from '../../types/event';
import { polyImgs } from '../imgs';

const STORAGE_KEY = 'event'
// בדיקה כפולה - גם סביבת Vite וגם הכתובת בדפדפן
const isProduction = import.meta.env.PROD || window.location.hostname.includes('github.io')

const PROXY = 'https://cors-anywhere.com/'
const POLY_BASE = 'https://gamma-api.polymarket.com'

// שימוש ב- + במקום Template Strings כדי למנוע קידוד אוטומטי של תווים מיוחדים
const POLY_EVENTS_API = isProduction ? PROXY + POLY_BASE : '/poly-api'
const POLY_SEARCH_API = isProduction ? PROXY + POLY_BASE + '/public-search' : '/poly-search'
const POLY_CLOB_API = isProduction ? PROXY + 'https://clob.polymarket.com' : '/poly-clob'
const POLY_COMMENTS_API = isProduction ? PROXY + POLY_BASE + '/comments' : '/poly-comments'

export const eventService = {
    query,
    getById,
    save,
    remove,
    addEventMsg,
    searchEvents,
    // getEventsByIds,
    fetchEventById,
    fetchMarketPriceHistory,
    getComments,
    fetchOrderBook,
    deleteEventMsg,
    fetchMarketById,
    getPerformance,

}

window.cs = eventService

async function query(filterBy: FilterBy, category: string = 'all', page: number = 0) {
    const sortBy = filterBy.sortField || 'volume'

    // אם זה GitHub Pages או Production – תמיד Polymarket
    if (window.location.hostname.includes('github.io') || import.meta.env.PROD) {
        return fetchEvents(category, page, sortBy)
    }

    // רק בלוקאלי ננסה backend
    try {
        const res = await fetch(`/api/event?txt=${filterBy.txt}&sortField=${sortBy}`)
        if (!res.ok) throw new Error()
        return await res.json()
    } catch {
        return fetchEvents(category, page, sortBy)
    }
}
// async function getEventsByIds(eventIds: string[]): Promise<Event[]> {
//     if (!eventIds || eventIds.length === 0) return [];

//     try {
//         const promises = eventIds.map(id =>
//             fetch(`/poly-api/event/${id}`)
//                 .then(res => res.ok ? res.json() : null)
//                 .catch(() => null)
//         );

//         const rawEvents = await Promise.all(promises);

//         // סינון תוצאות ריקות (במקרה ש-ID לא נמצא)
//         const validRawEvents = rawEvents.filter(ev => ev !== null);

//         // שימוש בפונקציית הנירמול שלך כדי להפוך אותם לטיפוס Event
//         return processRawEvents(validRawEvents);
//     } catch (err) {
//         console.error("Failed to fetch events by IDs:", err);
//         return [];
//     }
// }
async function fetchEventById(eventId: string): Promise<Event | null> {
    // שינוי לחיבור פשוט
    const url = POLY_EVENTS_API + '/events/' + eventId;

    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const rawEvent = await res.json();
        const processedEvents = processRawEvents([rawEvent]);
        return processedEvents.length > 0 ? processedEvents[0] : null;
    } catch (err) {
        console.error(`Error fetching event ${eventId}:`, err);
        return null;
    }
}


function getById(eventId: string): Promise<Event> {
    return storageService.get(STORAGE_KEY, eventId)
}

async function remove(eventId: string) {
    // throw new Error('Nope')
    await storageService.remove(STORAGE_KEY, eventId)
}

function save(event: Event) {
    if (event._id) {
        return storageService.put(STORAGE_KEY, event)
    } else {
        return storageService.post(STORAGE_KEY, event)
    }
}

async function addEventMsg(eventId: string, txt: string) {
    // Later, this is all done by the backend
    const msg: Msg = {
        _id: makeId(),
        by: userService.getLoggedinUser(),
        txt,
        aboutEventId: eventId,
        createdAt: Date.now()
    }
    await storageService.post('comments', msg)

    return msg
}

async function deleteEventMsg(msgId: string) {
    try {
        await storageService.remove('comments', msgId)

    } catch (err) {
        console.error(`Failed to delete message with ID ${msgId}:`, err)
        throw err
    }
}

//Demo Data

// --- פונקציה מרכזית לשליפת ונירמול הנתונים ---
export function getCategories(): string[] {
    return [
        "Politics", "Sports", "Crypto", "Finance", "Geopolitics",
        "Earnings", "Tech", "Culture", "World", "Economy",
        "Climate-science", "Mentions"
    ]
}
// export async function fetchPolyeventData(): Promise<Event[]> {
//     const categories = [
//         "Politics", "Sports", "Crypto", "Finance", "Geopolitics",
//         "Earnings", "Tech", "Culture", "World", "Economy",
//         "Climate-science", "Mentions"
//     ];

//     try {
//         const topEventsPromise = fetch('/poly-api/events?active=true&closed=false&limit=100&order=volume&ascending=false')
//             .then(res => res.ok ? res.json() : []);

//         const categoryPromises = categories.map(category =>
//             fetch(`/poly-api/events?active=true&closed=false&limit=100&tag=${category}`)
//                 .then(res => res.ok ? res.json() : [])
//                 .catch(() => [])
//         );

//         const [topEvents, ...categoryResults] = await Promise.all([topEventsPromise, ...categoryPromises]);
//         const combined = [...topEvents, ...categoryResults.flat()];

//         if (!combined.length) return [];

//         const uniqueMap = new Map<string, any>(); // מחיקת כפילויות
//         combined.forEach(ev => {
//             if (ev?.id) uniqueMap.set(ev.id, ev);
//         });

//         const uniqueRawEvents = Array.from(uniqueMap.values()); // החזרת מערך האירועים הייחודיים

//         return uniqueRawEvents.map(ev => {
//             const markets: Market[] = (ev.markets || []).map((m: any) => {
//                 let outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
//                 let rawPrices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;

//                 // חילוץ מזהי התמונות עבור ספורט
//                 let icons = [];
//                 try {
//                     icons = typeof m.groupItemIds === 'string' ? JSON.parse(m.groupItemIds) : (m.groupItemIds || []);
//                 } catch (e) {
//                     icons = [];
//                 }

//                 const outcomesList = Array.isArray(outcomes) ? outcomes : ["Yes", "No"];
//                 const prices = Array.isArray(rawPrices)
//                     ? rawPrices.map(p => Math.round(parseFloat(p) * 100))
//                     : outcomesList.map(() => 50);

//                 return {
//                     id: m.id || ev.id,
//                     question: m.question || ev.title,
//                     outcomes: outcomesList,
//                     outcomePrices: prices,
//                     clobTokenIds: m.clobTokenIds || [],
//                     icons: icons // שמירת המזהים לאייקונים
//                 };
//             });

//             if (markets.length === 0) {
//                 markets.push({
//                     id: ev.id, question: ev.title, outcomes: ["Yes", "No"], outcomePrices: [50, 50], clobTokenIds: [], icons: []
//                 });
//             }

//             const eventTags: string[] = Array.isArray(ev.tags)
//                 ? ev.tags.map((t: any) => (typeof t === 'string' ? t : t.label)).filter(Boolean)
//                 : [];

//             const primaryCat = categories.find(c =>
//                 eventTags.some(tag => tag.toLowerCase() === c.toLowerCase())
//             ) || eventTags[0] || 'General';

//             return {
//                 _id: ev.id,
//                 title: ev.title || ev.question,
//                 description: ev.description || "",
//                 imgUrl: ev.image || "https://polymarket.com/images/default.png",
//                 status: ev.closed ? 'closed' : 'open',
//                 endDate: ev.endDate,
//                 category: primaryCat,
//                 labels: Array.from(new Set([primaryCat, ...eventTags])),
//                 markets: markets,
//                 volume: Math.floor(ev.volume || 0),
//                 msgs: [],
//                 createdAt: ev.createdAt ? new Date(ev.createdAt).getTime() : Date.now()
//             } as Event;
//         }).sort(() => Math.random() - 0.5);

//     } catch (err) {
//         console.error("Fetch failed:", err);
//         return [];
//     }
// }
// --- הרצה ושמירה ---


// (async () => {
//     const demoEvents = await fetchPolyeventData();
//     
//     if (demoEvents.length > 0) {
//         saveToStorage(STORAGE_KEY, demoEvents);
//     }
// })();


const categories = [
    "Politics", "Sports", "Crypto", "Finance", "Geopolitics",
    "Earnings", "Tech", "Culture", "World", "Economy",
    "Climate-science", "Mentions"
];

// הוספת ה-Interface של המרקט הגולמי שמגיע מה-API (לפי הדוקומנטציה)
interface RawMarket {
    id: string;
    conditionId: string;
    question: string;
    outcomes: string | string[];
    outcomePrices: string | string[];
    clobTokenIds: string | string[];
    description?: string;
    lastTradePrice?: number;
    bestBid?: number;
    bestAsk?: number;
    volume?: number;
    orderPriceMinTickSize?: number;
    acceptingOrders?: boolean;
    acceptingOrdersTimestamp?: string;
    expiration?: string;
    createdAt?: string;
    updatedAt?: string;
    endDate?: string;
    closed?: boolean;
}

function processRawEvents(combined: any[], forcedCategory?: string): Event[] {
    if (!combined.length) return [];

    const uniqueMap = new Map<string, any>();
    combined.forEach(ev => {
        if (ev?.id) uniqueMap.set(ev.id, ev);
    });

    const uniqueRawEvents = Array.from(uniqueMap.values());

    return uniqueRawEvents.map(ev => {
        const rawMarkets: RawMarket[] = ev.markets || [];

        const markets: Market[] = rawMarkets.slice(0, 5).map((m: RawMarket) => {
            const outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
            const rawPrices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;
            const clobTokenIds = typeof m.clobTokenIds === 'string' ? JSON.parse(m.clobTokenIds) : m.clobTokenIds;

            const outcomesList: string[] = Array.isArray(outcomes) ? outcomes : ["Yes", "No"];
            const prices: number[] = Array.isArray(rawPrices)
                ? rawPrices.map((p: string) => Math.round(parseFloat(p) * 100))
                : outcomesList.map(() => 50);

            return {
                id: m.id || ev.id,
                conditionId: m.conditionId || null,
                question: m.question || ev.title,
                outcomes: outcomesList,
                outcomePrices: prices,
                clobTokenIds: Array.isArray(clobTokenIds) ? clobTokenIds : [],
                description: m.description || "",
                lastTradePrice: m.lastTradePrice,
                bestBid: m.bestBid,
                bestAsk: m.bestAsk,
                volume: m.volume || 0,
                minTickSize: m.orderPriceMinTickSize,
                acceptingOrders: m.acceptingOrders,
                acceptingOrdersTimestamp: m.acceptingOrdersTimestamp,
                expiration: m.expiration,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
                endDate: m.endDate || ev.endDate
            } as Market;
        });

        if (markets.length === 0) {
            markets.push({
                id: ev.id,
                conditionId: ev.conditionId || null,
                question: ev.title,
                outcomes: ["Yes", "No"],
                outcomePrices: [50, 50],
                clobTokenIds: []
            } as unknown as Market);
        }

        const eventTags: string[] = Array.isArray(ev.tags)
            ? ev.tags.map((t: any) => (typeof t === 'string' ? t : t.label)).filter(Boolean)
            : [];

        // לוגיקת בחירת קטגוריה:
        // אם הועברה קטגוריה ב-forcedCategory (מהלחיצה ב-UI), נשתמש בה.
        // אחרת נחפש התאמה בתגיות או נשתמש בראשונה שקיימת.
        const primaryCat = (forcedCategory && forcedCategory.toLowerCase() !== 'all')
            ? forcedCategory
            : categories.find(c => eventTags.some(tag => tag.toLowerCase() === c.toLowerCase()))
            || eventTags[0] || 'General';

        const createdAt = ev.createdAt ? new Date(ev.createdAt).getTime() : Date.now();
        const endDate = ev.endDate ? new Date(ev.endDate).getTime() : Date.now() + 86400000;

        return {
            _id: ev.id,
            title: ev.title || ev.question || "Untitled Event",
            description: ev.description || "",
            createdAt: createdAt,
            imgUrl: ev.image || ev.imgUrl || "https://polymarket.com/images/default.png",
            endDate: endDate,
            status: ev.closed ? 'closed' : 'open',
            category: primaryCat,
            labels: Array.from(new Set([primaryCat, ...eventTags])),
            markets: markets,
            volume: Math.floor(ev.volume || 0),
            msgs: [],
        } as Event;
    });
}
export async function fetchEvents(categoryName?: string, page: number = 0, sortBy: string = 'volume'): Promise<Event[]> {
    const limit = 30;
    const currentOffset = page * limit;

    const CATEGORY_MAP: Record<string, string> = {
        "politics": "2",
        "crypto": "21",
        "sports": "100639",
        "economy": "100260",
        "business": "100260",
        "finance": "100260",
        "science": "100267",
        "climate": "100267",
        "culture": "596",
        "entertainment": "596",
        "tech": "1401",
        "geopolitics": "100265",
        "world": "1",
        "mentions": "100251",
        "earnings": "100262"
    };

    let url = `${POLY_EVENTS_API}/events?active=true&closed=false&limit=${limit}&offset=${currentOffset}&order=${sortBy === 'newest' ? 'created_at' : 'volume'}&ascending=false`;

    if (categoryName && categoryName !== 'all') {
        const tagId = CATEGORY_MAP[categoryName.toLowerCase()];
        if (tagId) url += `&tag_id=${tagId}`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data = await res.json();

        // שליחת categoryName כ-forcedCategory כדי שהאירועים יתויגו נכון ב-UI
        let events = processRawEvents(data, categoryName);

        if (sortBy.toLowerCase() === 'trending') {
            const now = Date.now();
            events.sort((a, b) => {
                const getHours = (time: any) => Math.max(1, (now - (typeof time === 'number' ? time : new Date(time).getTime())) / (1000 * 60 * 60));
                return (b.volume / getHours(b.createdAt)) - (a.volume / getHours(a.createdAt));
            });
        }

        return events;
    } catch (err) {
        console.error("Fetch failed:", err);
        return [];
    }
}
// search:
export async function searchEvents(searchTerm: string, limit: number = 200): Promise<Event[]> {
    if (!searchTerm) return []

    // שימוש במשתנה הדינמי לחיפוש
    const url = `${POLY_SEARCH_API}?q=${encodeURIComponent(searchTerm)}&optimized=false&limit_per_type=${limit}&search_tags=true`

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        const rawResults = data.events || []

        const fixedResults = rawResults.map((ev: any) => ({
            ...ev,
            id: ev.id || ev.eventId || ev._id,
            tags: Array.isArray(ev.tags) ? ev.tags.map((t: any) => typeof t === 'string' ? { label: t } : t) : []
        }))

        return processRawEvents(fixedResults)
    } catch (err) {
        console.error("Search failed:", err)
        return []
    }
}



/**
 * מושכת היסטוריית מחירים עבור מרקט ספציפי
רזולוציית הזמן (למשל '6h', '1h', '1d')
 */
async function fetchMarketPriceHistory(clobTokenId: string, interval: string = ''): Promise<{ time: number, value: number }[]> {
    if (!interval) interval = '';
    // כאן היה /poly-clob/prices-history - שינינו למשתנה הדינמי
    const url = `${POLY_CLOB_API}/prices-history?market=${clobTokenId}&interval=${interval}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        if (!data || !data.history) return [];

        return data.history.map((point: { t: number, p: number }) => ({
            time: point.t,
            value: point.p
        }));
    } catch (err) {
        console.error("Error fetching CLOB history:", err);
        return [];
    }
}

/**
 * Fetches comments for a specific event.
 * @param eventId The ID of the event to fetch comments for.
 * @returns A promise that resolves to an array of comments.
 */
// event.service.ts

async function getComments(eventId: string): Promise<EventComment[]> {
    // משתמשים בנתיב הפרוקסי שהגדרנו ב-Vite
    const url = `${POLY_COMMENTS_API}?parent_entity_type=Event&parent_entity_id=${eventId}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch comments: ${res.statusText}`);
        const data = await res.json();

        // Polymarket מחזירים לפעמים מערך ישיר ולפעמים אובייקט עם שדה comments
        const comments = Array.isArray(data) ? data : (data.comments || []);
        const msgs = localStorage.getItem('comments') || '[]'

        const localComments = JSON.parse(msgs).filter((msg: any) => msg.aboutEventId === eventId)


        return [...localComments, ...comments];
    } catch (err) {
        console.error(`Error fetching comments for event ${eventId}:`, err);
        return [];
    }
}

// Order Book

async function fetchOrderBook(clobTokenId: string): Promise<Orderbook> {
    // שימוש במשתנה POLY_CLOB_API במקום במחרוזת קבועה
    const url = `${POLY_CLOB_API}/book?token_id=${clobTokenId}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status: ${res.status}`);

        const data: PolyOrderbookResponse = await res.json();

        const processLevels = (levels: PolyOrderbookLevel[]): OrderbookLevel[] => {
            let total = 0;
            return (levels || []).map((level) => {
                const size = parseFloat(level.size);
                const price = parseFloat(level.price);
                total += size;
                return { price, size, total };
            });
        };

        return {
            bids: processLevels(data.bids),
            asks: processLevels(data.asks)
        };
    } catch (err) {
        console.error("Orderbook fetch error:", err);
        return { bids: [], asks: [] };
    }
}

// market By Id

async function fetchMarketById(marketId: string): Promise<Market | null> {
    // 1. הגדרת כתובת היעד המקורית
    const targetUrl = `https://gamma-api.polymarket.com/markets/${marketId}`

    // 2. בחירת הפרוקסי המתאים לפי הסביבה
    // ב-GitHub Pages (isProduction) נשתמש ב-AllOrigins כי הוא לא דורש אישור ידני מהמשתמש
    // ב-Local נשתמש ב-Vite Proxy שהגדרת בסרוויס (POLY_EVENTS_API)
    const url = isProduction
        ? `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
        : `${POLY_EVENTS_API}/markets/${marketId}`

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Market not found: ${res.status}`)

        const raw: any = await res.json()

        // עיבוד נתונים (שימוש ב-JSON.parse למקרה שה-API מחזיר מחרוזת)
        const outcomes = typeof raw.outcomes === 'string' ? JSON.parse(raw.outcomes) : raw.outcomes
        const rawPrices = typeof raw.outcomePrices === 'string' ? JSON.parse(raw.outcomePrices) : raw.outcomePrices
        const clobTokenIds = typeof raw.clobTokenIds === 'string' ? JSON.parse(raw.clobTokenIds) : raw.clobTokenIds

        const prices = Array.isArray(rawPrices)
            ? rawPrices.map((p: string) => Math.round(parseFloat(p) * 100))
            : []

        return {
            id: raw.id,
            // חילוץ ה-ID של האירוע (Parent) - ב-Gamma API זה לרוב activeId או questionId
            eventId: raw.activeId || raw.eventId || raw.questionId || '',
            conditionId: raw.conditionId,
            question: raw.question,
            outcomePrices: prices,
            outcomes: Array.isArray(outcomes) ? outcomes : ["Yes", "No"],
            clobTokenIds: Array.isArray(clobTokenIds) ? clobTokenIds : [],
            description: raw.description || ""
        }
    } catch (err) {
        console.error(`Error fetching market ${marketId}:`, err)
        return null
    }
}






export async function getPerformance(portfolio: any[], timeRange: string) {
    if (!portfolio || !portfolio.length) return { history: [], stats: null }

    const historyPromises = portfolio.map(async (pos) => {
        const market = await eventService.fetchMarketById(pos.marketId)
        if (!market || !market.clobTokenIds?.[0]) return null

        const history = await eventService.fetchMarketPriceHistory(market.clobTokenIds[0], '1d')

        // נמצא את המחיר הנוכחי מההיסטוריה (הנקודה האחרונה)
        const latestPrice = history.length > 0 ? history[history.length - 1].value : 0

        return {
            shares: pos.shares,
            avgPriceInDollars: pos.avgPrice / 100,
            latestPrice,
            history
        }
    })

    const results = (await Promise.all(historyPromises)).filter((pos): pos is NonNullable<typeof pos> => !!pos)

    let totalCostBasis = 0  // כמה כסף עלה לי לקנות הכל
    let totalCurrentValue = 0 // כמה הכל שווה עכשיו בשוק
    const timeMap: Record<number, number> = {}

    results.forEach(pos => {
        // 1. חישוב עלות (מה שמופיע לך בטבלה כ-Avg Price)
        totalCostBasis += pos.shares * pos.avgPriceInDollars

        // 2. חישוב שווי נוכחי (מה שמופיע לך בטבלה כ-Value)
        totalCurrentValue += pos.shares * pos.latestPrice

        // 3. בניית הגרף
        pos.history.forEach((point: any) => {
            timeMap[point.time] = (timeMap[point.time] || 0) + (pos.shares * point.value)
        })
    })

    const history = Object.entries(timeMap)
        .map(([time, value]) => ({ time: Number(time), value }))
        .sort((a, b) => a.time - b.time)

    // החישוב הסופי - זה מה שיופיע ב-Summary
    const totalPnl = totalCurrentValue - totalCostBasis
    const pnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0

    return {
        history,
        stats: {
            currentTotalValue: totalCurrentValue,
            totalPnl,
            pnlPercent
        }
    }
}