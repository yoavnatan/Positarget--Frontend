import { Event, Market } from '../../types/event'
import { httpService } from '../http.service'

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
}

async function query(filterBy = { txt: '' }) {
    return httpService.get(`event`, filterBy)
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
//         return  ;
//     }
// }

async function fetchEventById(eventId: string): Promise<Event | null> {
    const url = `https://gamma-api.polymarket.com/events/${eventId}`;

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

function getById(eventId: string) {
    return httpService.get(`event/${eventId}`)
}

async function remove(eventId: string) {
    return httpService.delete(`event/${eventId}`)
}
async function save(event: Event) {
    var savedEvent
    if (event._id) {
        savedEvent = await httpService.put(`event/${event._id}`, event)
    } else {
        savedEvent = await httpService.post('event', event)
    }
    return savedEvent
}

async function addEventMsg(eventId: string, txt: string) {
    const savedMsg = await httpService.post(`event/${eventId}/msg`, { txt })
    return savedMsg
}

const categories = [
    "Politics", "Sports", "Crypto", "Finance", "Geopolitics",
    "Earnings", "Tech", "Culture", "World", "Economy",
    "Climate-science", "Mentions"
];

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
export async function fetchEvents(categoryName?: string, page: number = 0): Promise<Event[]> {
    let accumulatedEvents: Event[] = [];
    const limit = 30;
    let currentOffset = page * limit;

    const maxAttempts = (page === 0) ? 10 : 4;
    let attempts = 0;

    let apiTag = categoryName;
    if (categoryName?.toLowerCase() === 'climate-science') apiTag = 'Climate';

    while (accumulatedEvents.length < limit && attempts < maxAttempts) {
        attempts++;

        let url = `/poly-api/events?active=true&closed=false&limit=${limit}&offset=${currentOffset}&order=volume&ascending=false`;
        if (apiTag && apiTag !== 'all') url += `&tag=${encodeURIComponent(apiTag)}`;

        try {
            const res = await fetch(url);
            const data = res.ok ? await res.json() : [];
            if (!data || data.length === 0) break;

            let processed = processRawEvents(data);

            if (categoryName?.toLowerCase() === 'climate-science') {
                processed = processed.filter(ev =>
                    ev.labels.some(label =>
                        label.toLowerCase().includes('climate') ||
                        label.toLowerCase().includes('science')
                    )
                );
            } else if (categoryName && categoryName !== 'all') {
                processed = processed.filter(ev =>
                    ev.labels.some(label => label.toLowerCase() === categoryName.toLowerCase())
                );
            }

            accumulatedEvents.push(...processed);
            currentOffset += limit;

            // אופטימיזציה: אם מצאנו לפחות 10 אירועים, אפשר לעצור כדי לא לעכב את המשתמש
            if (accumulatedEvents.length >= 10 && categoryName !== 'all') break;
            if (!categoryName || categoryName === 'all') break;

        } catch (err) {
            break;
        }
    }

    const sorted = accumulatedEvents.sort((a, b) => b.volume - a.volume);
    return sorted.slice(0, limit);
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

async function fetchMarketPriceHistory(conditionId: string, interval: string = '6h'): Promise<{ time: number; value: number }[]> {
    // שים לב לשינוי בנתיב מ-poly-api ל-poly-clob
    const url = `/poly-clob/prices-history?market=${conditionId}&interval=${interval}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch price history');

        const data = await res.json();
        if (!data || !data.history) return [];

        return data.history.map((point: { t: number; p: number }) => ({
            time: point.t,
            value: point.p
        }));
    } catch (err) {
        console.error("Error fetching price history:", err);
        return [];
    }
}