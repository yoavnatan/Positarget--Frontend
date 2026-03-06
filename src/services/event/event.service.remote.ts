import { Event, Market } from '../../types/event'
import { httpService } from '../http.service'

export const eventService = {
    query,
    getById,
    save,
    remove,
    addEventMsg,
    searchEvents,
}

async function query(filterBy = { txt: '' }) {
    return httpService.get(`event`, filterBy)
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

function processRawEvents(combined: any[]): Event[] {
    if (!combined.length) return [];

    const uniqueMap = new Map<string, any>();
    combined.forEach(ev => {
        if (ev?.id) uniqueMap.set(ev.id, ev);
    });

    const uniqueRawEvents = Array.from(uniqueMap.values());

    return uniqueRawEvents.map(ev => {
        const markets: Market[] = (ev.markets || []).map((m: any) => {
            let outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
            let rawPrices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;

            const outcomesList = Array.isArray(outcomes) ? outcomes : ["Yes", "No"];
            const prices = Array.isArray(rawPrices)
                ? rawPrices.map((p: any) => Math.round(parseFloat(p) * 100))
                : outcomesList.map(() => 50);

            return {
                id: m.id || ev.id,
                question: m.question || ev.title,
                outcomes: outcomesList,
                outcomePrices: prices,
                clobTokenIds: m.clobTokenIds || [],
            };
        });

        if (markets.length === 0) {
            markets.push({
                id: ev.id, question: ev.title, outcomes: ["Yes", "No"], outcomePrices: [50, 50], clobTokenIds: []
            });
        }

        const eventTags: string[] = Array.isArray(ev.tags)
            ? ev.tags.map((t: any) => (typeof t === 'string' ? t : t.label)).filter(Boolean)
            : [];

        const primaryCat = categories.find(c =>
            eventTags.some(tag => tag.toLowerCase() === c.toLowerCase())
        ) || eventTags[0] || 'General';

        // --- הוספת הלוגיקה עבור createdAt ו-endDate ---
        const createdAt = ev.createdAt ? new Date(ev.createdAt).getTime() : Date.now();
        const endDate = ev.endDate ? new Date(ev.endDate).getTime() : Date.now() + 86400000; // ברירת מחדל מחר

        return {
            _id: ev.id,
            title: ev.title || ev.question || "Untitled Event",
            description: ev.description || "",
            createdAt: createdAt, // עומד בחוזה של ה-Interface
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