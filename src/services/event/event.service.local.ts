
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


async function query(filterBy: FilterBy, categorie: string, page: number) {
    // var events: Event[] = await storageService.query(STORAGE_KEY)
    var events: Event[] = await fetchEvents(categorie, page)
    console.log(events)
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
async function getEventsByIds(eventIds: string[]): Promise<Event[]> {
    // אנחנו יוצרים מערך של Promises לכל ID
    const promises = eventIds.map(id =>
        // שים לב: כאן אין ?closed=false! אנחנו רוצים את האמת, גם אם היא סגורה.
        fetch(`/poly-api/event/${id}`).then(res => res.json())
    );

    const rawEvents = await Promise.all(promises);
    // משתמשים בפונקציית הנירמול שכבר כתבת (processRawEvents)
    return processRawEvents(rawEvents);
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

function processRawEvents(combined: any[]): Event[] {
    if (!combined.length) return [];

    const uniqueMap = new Map<string, any>();
    combined.forEach(ev => {
        if (ev?.id) uniqueMap.set(ev.id, ev);
    }); // מחיקת כפילויות על ידי שימוש במפה עם מזהה האירוע כמפתח

    const uniqueRawEvents = Array.from(uniqueMap.values());

    return uniqueRawEvents.map(ev => {
        const markets: Market[] = (ev.markets || []).map((m: any) => {
            let outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes;
            let rawPrices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices;


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
            };
        }); // נירמול שווקים

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
    })
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