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
const isProduction = import.meta.env.PROD || window.location.hostname.includes('github.io')

const POLY_BASE = 'https://gamma-api.polymarket.com'
const POLY_CLOB_BASE = 'https://clob.polymarket.com'

const WORKER_URL = 'https://dry-dawn-4a21.yoavnatan-yn.workers.dev'
function proxyUrl(url: string): string {
    if (isProduction) return `${WORKER_URL}/${url}`
    return url
}

const POLY_EVENTS_API = '/poly-api'
const POLY_SEARCH_API = '/poly-search'
const POLY_CLOB_API = '/poly-clob'
const POLY_COMMENTS_API = '/poly-comments'

export const eventService = {
    query,
    addEventMsg,
    searchEvents,
    fetchEventById,
    fetchMarketPriceHistory,
    getComments,
    fetchOrderBook,
    deleteEventMsg,
    fetchMarketById,
    getPerformance,
    save,
    remove,
}

window.cs = eventService

async function query(filterBy: FilterBy, category: string = 'all', page: number = 0) {
    const sortBy = filterBy.sortField || 'volume'
    return fetchEvents(category, page, sortBy)
}

async function fetchEventById(eventId: string): Promise<Event | null> {
    const rawUrl = `${POLY_BASE}/events/${eventId}`
    const url = isProduction ? proxyUrl(rawUrl) : `${POLY_EVENTS_API}/events/${eventId}`

    try {
        const res = await fetch(url)
        if (!res.ok) return null
        const rawEvent = await res.json()
        const processedEvents = processRawEvents([rawEvent])
        return processedEvents.length > 0 ? processedEvents[0] : null
    } catch (err) {
        console.error(`Error fetching event ${eventId}:`, err)
        return null
    }
}

function getById(eventId: string): Promise<Event> {
    return storageService.get(STORAGE_KEY, eventId)
}

async function remove(eventId: string) {
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

const categories = [
    "Politics", "Sports", "Crypto", "Finance", "Geopolitics",
    "Earnings", "Tech", "Culture", "World", "Economy",
    "Climate-science", "Mentions"
]

interface RawMarket {
    id: string
    conditionId: string
    question: string
    outcomes: string | string[]
    outcomePrices: string | string[]
    clobTokenIds: string | string[]
    description?: string
    lastTradePrice?: number
    bestBid?: number
    bestAsk?: number
    volume?: number
    orderPriceMinTickSize?: number
    acceptingOrders?: boolean
    acceptingOrdersTimestamp?: string
    expiration?: string
    createdAt?: string
    updatedAt?: string
    endDate?: string
    closed?: boolean
}

function processRawEvents(combined: any[], forcedCategory?: string): Event[] {
    if (!combined.length) return []

    const uniqueMap = new Map<string, any>()
    combined.forEach(ev => { if (ev?.id) uniqueMap.set(ev.id, ev) })
    const uniqueRawEvents = Array.from(uniqueMap.values())

    return uniqueRawEvents.map(ev => {
        const rawMarkets: RawMarket[] = ev.markets || []

        const markets: Market[] = rawMarkets.slice(0, 5).map((m: RawMarket) => {
            const outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes
            const rawPrices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices
            const clobTokenIds = typeof m.clobTokenIds === 'string' ? JSON.parse(m.clobTokenIds) : m.clobTokenIds

            const outcomesList: string[] = Array.isArray(outcomes) ? outcomes : ["Yes", "No"]
            const prices: number[] = Array.isArray(rawPrices)
                ? rawPrices.map((p: string) => Math.round(parseFloat(p) * 100))
                : outcomesList.map(() => 50)

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
            } as Market
        })

        if (markets.length === 0) {
            markets.push({
                id: ev.id,
                conditionId: ev.conditionId || null,
                question: ev.title,
                outcomes: ["Yes", "No"],
                outcomePrices: [50, 50],
                clobTokenIds: []
            } as unknown as Market)
        }

        const eventTags: string[] = Array.isArray(ev.tags)
            ? ev.tags.map((t: any) => (typeof t === 'string' ? t : t.label)).filter(Boolean)
            : []

        const primaryCat = (forcedCategory && forcedCategory.toLowerCase() !== 'all')
            ? forcedCategory
            : categories.find(c => eventTags.some(tag => tag.toLowerCase() === c.toLowerCase()))
            || eventTags[0] || 'General'

        const createdAt = ev.createdAt ? new Date(ev.createdAt).getTime() : Date.now()
        const endDate = ev.endDate ? new Date(ev.endDate).getTime() : Date.now() + 86400000

        return {
            _id: ev.id,
            title: ev.title || ev.question || "Untitled Event",
            description: ev.description || "",
            createdAt,
            imgUrl: ev.image || ev.imgUrl || "https://polymarket.com/images/default.png",
            endDate,
            status: ev.closed ? 'closed' : 'open',
            category: primaryCat,
            labels: Array.from(new Set([primaryCat, ...eventTags])),
            markets,
            volume: Math.floor(ev.volume || 0),
            msgs: [],
        } as Event
    })
}

export async function fetchEvents(categoryName?: string, page: number = 0, sortBy: string = 'volume'): Promise<Event[]> {
    const limit = 32
    const currentOffset = page * limit

    const CATEGORY_MAP: Record<string, string> = {
        "politics": "2", "sports": "100639", "crypto": "21", "finance": "120",
        "geopolitics": "100265", "earnings": "100262", "tech": "1401",
        "culture": "596", "world": "1", "economy": "100260",
        "climate-science": "100267", "mentions": "100251"
    }

    const queryParams = `active=true&closed=false&limit=${limit}&offset=${currentOffset}&order=volume&ascending=false`
    const categoryParam = (() => {
        if (!categoryName || categoryName === 'all') return ''
        const tagId = CATEGORY_MAP[categoryName.toLowerCase()]
        return tagId ? `&tag_id=${tagId}` : ''
    })()

    const rawUrl = `${POLY_BASE}/events?${queryParams}${categoryParam}`
    const localUrl = `/poly-api/events?${queryParams}${categoryParam}`
    const url = isProduction ? proxyUrl(rawUrl) : localUrl

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`API Error: ${res.status}`)

        const data = await res.json()
        if (!data || data.length === 0) return []

        let events = processRawEvents(data, categoryName)
        events = events.filter(ev => ev.volume > 10)

        const now = Date.now()

        if (sortBy.toLowerCase() === 'trending') {
            events.sort((a, b) => {
                const getHours = (time: any) => {
                    const t = typeof time === 'number' ? time : new Date(time).getTime()
                    return Math.max(1, (now - t) / (1000 * 60 * 60))
                }
                return (b.volume / getHours(b.createdAt)) - (a.volume / getHours(a.createdAt))
            })
        } else if (sortBy.toLowerCase() === 'newest') {
            events.sort((a, b) => {
                const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime()
                const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime()
                return timeB - timeA
            })
        }

        return events
    } catch (err) {
        console.error("Fetch failed:", err)
        return []
    }
}

export async function searchEvents(searchTerm: string, limit: number = 200): Promise<Event[]> {
    if (!searchTerm) return []

    const rawUrl = `${POLY_BASE}/public-search?q=${encodeURIComponent(searchTerm)}&optimized=false&limit_per_type=${limit}&search_tags=true`
    const url = isProduction ? proxyUrl(rawUrl) : `${POLY_SEARCH_API}?q=${encodeURIComponent(searchTerm)}&optimized=false&limit_per_type=${limit}&search_tags=true`

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

async function fetchMarketPriceHistory(clobTokenId: string, interval: string = '1h'): Promise<{ time: number, value: number }[]> {
    const activeInterval = interval || '1h'
    const rawUrl = `${POLY_CLOB_BASE}/prices-history?market=${clobTokenId}&interval=${activeInterval}`
    const url = isProduction ? proxyUrl(rawUrl) : `${POLY_CLOB_API}/prices-history?market=${clobTokenId}&interval=${activeInterval}`

    try {
        const res = await fetch(url)
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            console.error("Polymarket API Error details:", errorData)
            throw new Error(`Status: ${res.status}`)
        }

        const data = await res.json()
        if (!data || !data.history || !Array.isArray(data.history)) {
            console.warn("No history data found in response for:", clobTokenId)
            return []
        }

        return data.history.map((point: { t: number, p: number }) => ({
            time: point.t,
            value: point.p
        }))
    } catch (err) {
        console.error("Error fetching CLOB history:", err)
        return []
    }
}

async function getComments(eventId: string): Promise<EventComment[]> {
    const rawUrl = `${POLY_BASE}/comments?parent_entity_type=Event&parent_entity_id=${eventId}`
    const url = isProduction ? proxyUrl(rawUrl) : `${POLY_COMMENTS_API}?parent_entity_type=Event&parent_entity_id=${eventId}`

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to fetch comments: ${res.statusText}`)
        const data = await res.json()

        const comments = Array.isArray(data) ? data : (data.comments || [])
        const msgs = localStorage.getItem('comments') || '[]'
        const localComments = JSON.parse(msgs).filter((msg: any) => msg.aboutEventId === eventId)

        return [...localComments, ...comments]
    } catch (err) {
        console.error(`Error fetching comments for event ${eventId}:`, err)
        return []
    }
}

async function fetchOrderBook(clobTokenId: string): Promise<Orderbook> {
    const rawUrl = `${POLY_CLOB_BASE}/book?token_id=${clobTokenId}`
    const url = isProduction ? proxyUrl(rawUrl) : `${POLY_CLOB_API}/book?token_id=${clobTokenId}`

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Status: ${res.status}`)

        const data: PolyOrderbookResponse = await res.json()

        const processLevels = (levels: PolyOrderbookLevel[]): OrderbookLevel[] => {
            let total = 0
            return (levels || []).map((level) => {
                const size = parseFloat(level.size)
                const price = parseFloat(level.price)
                total += size
                return { price, size, total }
            })
        }

        return {
            bids: processLevels(data.bids),
            asks: processLevels(data.asks)
        }
    } catch (err) {
        console.error("Orderbook fetch error:", err)
        return { bids: [], asks: [] }
    }
}

async function fetchMarketById(marketId: string): Promise<Market | null> {
    const rawUrl = `${POLY_BASE}/markets/${marketId}`
    const url = isProduction ? proxyUrl(rawUrl) : `${POLY_EVENTS_API}/markets/${marketId}`

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Market not found: ${res.status}`)

        const raw: any = await res.json()

        const outcomes = typeof raw.outcomes === 'string' ? JSON.parse(raw.outcomes) : raw.outcomes
        const rawPrices = typeof raw.outcomePrices === 'string' ? JSON.parse(raw.outcomePrices) : raw.outcomePrices
        const clobTokenIds = typeof raw.clobTokenIds === 'string' ? JSON.parse(raw.clobTokenIds) : raw.clobTokenIds

        const prices = Array.isArray(rawPrices)
            ? rawPrices.map((p: string) => Math.round(parseFloat(p) * 100))
            : []

        return {
            id: raw.id,
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
        const latestPrice = history.length > 0 ? history[history.length - 1].value : 0

        return {
            shares: pos.shares,
            avgPriceInDollars: pos.avgPrice / 100,
            latestPrice,
            history
        }
    })

    const results = (await Promise.all(historyPromises)).filter((pos): pos is NonNullable<typeof pos> => !!pos)

    let totalCostBasis = 0
    let totalCurrentValue = 0
    const timeMap: Record<number, number> = {}

    results.forEach(pos => {
        totalCostBasis += pos.shares * pos.avgPriceInDollars
        totalCurrentValue += pos.shares * pos.latestPrice
        pos.history.forEach((point: any) => {
            timeMap[point.time] = (timeMap[point.time] || 0) + (pos.shares * point.value)
        })
    })

    const history = Object.entries(timeMap)
        .map(([time, value]) => ({ time: Number(time), value }))
        .sort((a, b) => a.time - b.time)

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
