import { Event, EventComment, FilterBy, Market, Msg, Orderbook, OrderbookLevel, PolyOrderbookLevel, PolyOrderbookResponse } from '../../types/event'
import { httpService } from '../http.service'

const BASE_ENDPOINT = 'event'

export const eventService = {
    query,
    fetchEventById,
    searchEvents,
    fetchOrderBook,
    getComments,
    fetchMarketById,
    getPerformance,
    fetchMarketPriceHistory,
    addEventMsg,
    deleteEventMsg,
}

async function query(filterBy: FilterBy, category: string = 'all', page: number = 0): Promise<Event[]> {
    const sortBy = filterBy?.sortField || 'volume'

    const params = {
        category,
        page,
        sortBy
    }

    try {
        // עכשיו הבק-אנד מחזיר את הנתונים כבר ממוינים ומנורמלים
        return await httpService.get<Event[]>(BASE_ENDPOINT, params)
    } catch (err) {
        console.error('Error in eventService query:', err)
        throw err
    }
}

async function fetchEventById(eventId: string): Promise<Event | null> {
    try {
        return await httpService.get<Event>(`${BASE_ENDPOINT}/${eventId}`)
    } catch (err) {
        console.error(`Error fetching event ${eventId} from backend:`, err)
        return null
    }
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


async function searchEvents(searchTerm: string): Promise<Event[]> {
    if (!searchTerm) return []

    try {
        // שליחת ה-searchTerm כפרמטר q
        return await httpService.get<Event[]>(`${BASE_ENDPOINT}/search`, { q: searchTerm })
    } catch (err) {
        console.error("Search from backend failed:", err)
        return []
    }
}


async function fetchOrderBook(clobTokenId: string): Promise<Orderbook> {
    try {
        return await httpService.get<Orderbook>(`${BASE_ENDPOINT}/orderbook`, { clobTokenId })
    } catch (err) {
        console.error("Orderbook fetch from backend failed:", err)
        return { bids: [], asks: [] }
    }
}

async function getComments(eventId: string): Promise<EventComment[]> {
    try {
        // קריאה לבק-אנד: /api/event/123/comments
        return await httpService.get<EventComment[]>(`${BASE_ENDPOINT}/${eventId}/comments`)
    } catch (err) {
        console.error(`Error fetching comments for event ${eventId} from backend:`, err)
        return []
    }
}

async function fetchMarketById(marketId: string): Promise<Market | null> {
    try {
        // פנייה ישירה לבק-אנד שלך
        return await httpService.get<Market>(`${BASE_ENDPOINT}/market/${marketId}`)
    } catch (err) {
        console.error(`Error fetching market ${marketId} from backend:`, err)
        return null
    }
}


async function getPerformance(portfolio: any[], timeRange: string = '1d'): Promise<any> {
    if (!portfolio || !portfolio.length) return { history: [], stats: null }

    try {
        // שולחים את הפורטפוליו בתוך אובייקט ל-POST request
        return await httpService.post(`${BASE_ENDPOINT}/performance`, { portfolio, timeRange })
    } catch (err) {
        console.error("Failed to get performance from backend:", err)
        return { history: [], stats: null }
    }
}

async function fetchMarketPriceHistory(clobTokenId: string, interval: string = ''): Promise<{ time: number, value: number }[]> {
    try {
        const params = { clobTokenId, interval }
        return await httpService.get(`${BASE_ENDPOINT}/price-history`, params)
    } catch (err) {
        console.error("Price history fetch from backend failed:", err)
        return []
    }
}

async function addEventMsg(eventId: string, txt: string): Promise<any> {
    try {
        // אנחנו שולחים את הטקסט, השרת כבר ידע מי המשתמש לפי ה-Cookie/Token
        return await httpService.post(`${BASE_ENDPOINT}/${eventId}/msg`, { txt, eventId })
    } catch (err) {
        console.error("Failed to add message via backend:", err)
        throw err
    }
}

async function deleteEventMsg(msgId: string): Promise<void> {
    try {
        await httpService.delete(`${BASE_ENDPOINT}/msg/${msgId}`)
    } catch (err) {
        console.error(`Failed to delete message ${msgId} via backend:`, err)
        throw err
    }
}

