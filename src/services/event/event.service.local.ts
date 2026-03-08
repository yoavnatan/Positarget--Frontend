
declare global {
    interface Window {
        cs: typeof eventService;
    }
}

import { storageService } from '../async-storage.service'
import { makeId, saveToStorage } from '../util.service'
import { userService } from '../user'
import { FilterBy, Event, Market } from '../../types/event';
import { polyImgs } from '../imgs';

const STORAGE_KEY = 'event'

export const eventService = {
    query,
    getById,
    save,
    remove,
    addEventMsg,
    searchEvents,
    // getEventsByIds,
    fetchEventById,
    fetchMarketPriceHistory
}
window.cs = eventService


async function query(filterBy: FilterBy, category: string = 'all', page: number = 0) {
    // שליפת המיון מהפילטר. אם הוא ריק, ברירת המחדל היא volume
    const sortBy = filterBy.sortField || 'volume'
    console.log(sortBy)
    // שליחת ה-sortBy ל-fetchEvents
    var events: Event[] = await fetchEvents(category, page, sortBy)

    // סינון טקסטואלי מקומי רק אם המשתמש הזין טקסט בחיפוש
    if (filterBy.txt) {
        const regex = new RegExp(filterBy.txt, 'i')
        events = events.filter(event =>
            regex.test(event.title) ||
            (event.description && regex.test(event.description))
        )
    }

    return events
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
    const url = `/poly-api/events/${eventId}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Failed to fetch event with ID ${eventId}: ${res.statusText}`);
            return null;
        }
        const rawEvent = await res.json();
        const processedEvents = processRawEvents([rawEvent]);

        return processedEvents.length > 0 ? processedEvents[0] : null;
    } catch (err) {
        console.error(`Error fetching event with ID ${eventId}:`, err);
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
    const event = await getById(eventId)

    const msg = {
        id: makeId(),
        by: userService.getLoggedinUser(),
        txt
    }
    event.msgs.push(msg)
    await storageService.put(STORAGE_KEY, event)

    return msg
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
//     console.log("Processed Events:", demoEvents);
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

function processRawEvents(combined: any[]): Event[] {
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

                // נתונים מלאים מה-Market API
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
            } as Market);
        }

        const eventTags: string[] = Array.isArray(ev.tags)
            ? ev.tags.map((t: any) => (typeof t === 'string' ? t : t.label)).filter(Boolean)
            : [];

        const primaryCat = categories.find(c =>
            eventTags.some(tag => tag.toLowerCase() === c.toLowerCase())
        ) || eventTags[0] || 'General';

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

    // אנחנו תמיד מבקשים volume מה-API כדי לקבל אירועים "משמעותיים" ולא לקבל 422
    let url = `/poly-api/events?active=true&closed=false&limit=${limit}&offset=${currentOffset}&order=volume&ascending=false`;

    if (categoryName && categoryName !== 'all') {
        const apiTag = categoryName === 'Climate-science' ? 'Climate' : categoryName;
        url += `&tag=${encodeURIComponent(apiTag)}`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const data = await res.json();
        let events = processRawEvents(data);

        // --- לוגיקת המיון המקומית שלך ---
        const now = Date.now();

        if (sortBy.toLowerCase() === 'volume') {
            events.sort((a, b) => b.volume - a.volume);
        }
        else if (sortBy.toLowerCase() === 'newest') {
            events.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
        }
        else if (sortBy.toLowerCase() === 'trending') {
            events.sort((a, b) => {
                // חישוב שעות מאז יצירה (מינימום שעה אחת למניעת חילוק ב-0)
                const getHours = (time: number) => Math.max(1, (now - time) / (1000 * 60 * 60));

                const scoreA = a.volume / getHours(typeof a.createdAt === 'number' ? a.createdAt : a.createdAt.getTime());
                const scoreB = b.volume / getHours(typeof b.createdAt === 'number' ? b.createdAt : b.createdAt.getTime());

                return scoreB - scoreA;
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

    const url = `/poly-search?q=${encodeURIComponent(searchTerm)}&optimized=false&limit_per_type=${limit}&search_tags=true`

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error('Search failed')

        const data = await res.json()
        const rawResults = data.events || []

        const fixedResults = rawResults.map((ev: any) => {
            const safeId = ev.id || ev.eventId || ev._id

            return {
                ...ev,
                id: safeId,
                tags: Array.isArray(ev.tags)
                    ? ev.tags.map((t: any) => typeof t === 'string' ? { label: t } : t)
                    : []
            }
        })

        const processed = processRawEvents(fixedResults)

        return processed

    } catch (err) {
        console.error("Search failed:", err)
        return []
    }
}



/**
 * מושכת היסטוריית מחירים עבור מרקט ספציפי
רזולוציית הזמן (למשל '6h', '1h', '1d')
 */
async function fetchMarketPriceHistory(clobTokenId: string) {
    // שימוש ב-clobTokenId בתוך ה-URL
    const url = `/poly-clob/prices-history?market=${clobTokenId}&interval=all`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status: ${res.status}`);

        const data = await res.json();

        // ה-CLOB מחזיר אובייקט עם שדה history
        if (!data || !data.history) return [];

        return data.history.map((point: { t: number, p: number }) => ({
            time: point.t, // Unix timestamp
            value: point.p  // Price (0-1)
        }));
    } catch (err) {
        console.error("Error fetching CLOB history:", err);
        return [];
    }
}