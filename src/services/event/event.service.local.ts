
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
    addEventMsg
}
window.cs = eventService


async function query(filterBy: FilterBy) {
    var events: Event[] = await storageService.query(STORAGE_KEY)
    const { txt, sortField, sortDir } = filterBy

    if (txt) {
        const regex = new RegExp(filterBy.txt, 'i')
        events = events.filter(event => regex.test(event.title) || regex.test(event.description))
    }
    // if (minSpeed) {
    //     events = events.filter(event => event.speed >= minSpeed)
    // }
    // if (sortField === 'vendor') {
    //     events.sort((event1, event2) =>
    //         event1[sortField].localeCompare(event2[sortField]) * +sortDir)
    // }
    // if (sortField === 'speed') {
    //     events.sort((event1, event2) =>
    //         (event1[sortField] - event2[sortField]) * +sortDir)
    // }

    return events
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

export async function fetchDiversePolyeventData(): Promise<Event[]> {
    const categories = [
        "Politics", "Sports", "Crypto", "Finance", "Geopolitics",
        "Earnings", "Tech", "Culture", "World", "Economy",
        "Climate-science", "Mentions"
    ];

    try {
        const topEventsPromise = fetch('/poly-api/events?active=true&closed=false&limit=100&order=volume&ascending=false')
            .then(res => res.ok ? res.json() : []);

        const categoryPromises = categories.map(category =>
            fetch(`/poly-api/events?active=true&closed=false&limit=50&tag=${category}`)
                .then(res => res.ok ? res.json() : [])
                .catch(() => [])
        );

        const [topEvents, ...categoryResults] = await Promise.all([topEventsPromise, ...categoryPromises]);
        const combined = [...topEvents, ...categoryResults.flat()];

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

                // חילוץ מזהי התמונות עבור ספורט
                let icons = [];
                try {
                    icons = typeof m.groupItemIds === 'string' ? JSON.parse(m.groupItemIds) : (m.groupItemIds || []);
                } catch (e) {
                    icons = [];
                }

                const outcomesList = Array.isArray(outcomes) ? outcomes : ["Yes", "No"];
                const prices = Array.isArray(rawPrices)
                    ? rawPrices.map(p => Math.round(parseFloat(p) * 100))
                    : outcomesList.map(() => 50);

                return {
                    id: m.id || ev.id,
                    question: m.question || ev.title,
                    outcomes: outcomesList,
                    outcomePrices: prices,
                    clobTokenIds: m.clobTokenIds || [],
                    icons: icons // שמירת המזהים לאייקונים
                };
            });

            if (markets.length === 0) {
                markets.push({
                    id: ev.id, question: ev.title, outcomes: ["Yes", "No"], outcomePrices: [50, 50], clobTokenIds: [], icons: []
                });
            }

            const eventTags: string[] = Array.isArray(ev.tags)
                ? ev.tags.map((t: any) => (typeof t === 'string' ? t : t.label)).filter(Boolean)
                : [];

            const primaryCat = categories.find(c =>
                eventTags.some(tag => tag.toLowerCase() === c.toLowerCase())
            ) || eventTags[0] || 'General';

            return {
                _id: ev.id,
                title: ev.title || ev.question,
                description: ev.description || "",
                imgUrl: ev.image || "https://polymarket.com/images/default.png",
                status: ev.closed ? 'closed' : 'open',
                endDate: ev.endDate,
                category: primaryCat,
                labels: Array.from(new Set([primaryCat, ...eventTags])),
                markets: markets,
                volume: Math.floor(ev.volume || 0),
                msgs: [],
                createdAt: ev.createdAt ? new Date(ev.createdAt).getTime() : Date.now()
            } as Event;
        }).sort(() => Math.random() - 0.5);

    } catch (err) {
        console.error("Fetch failed:", err);
        return [];
    }
}
// --- הרצה ושמירה ---
(async () => {
    const demoEvents = await fetchDiversePolyeventData();
    console.log("Processed Events:", demoEvents);
    if (demoEvents.length > 0) {
        saveToStorage(STORAGE_KEY, demoEvents);
    }
})();