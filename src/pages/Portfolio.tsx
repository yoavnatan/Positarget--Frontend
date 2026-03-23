import { useEffect, useState } from "react"
import { eventService } from "../services/event"
import { useAppDispatch, useAppSelector } from "../store/store"
import { Position } from "../types/user.type"
import { useNavigate } from "react-router"
import { setSelectedOutcome, setTradingDirection, setTradingMethod } from "../store/slices/user.slice"
import { setModalType } from "../store/slices/system.slice"
import { PortfolioChart } from "../cmps/portfolioChart"

interface EnrichedPosition extends Position {
    currentPrice?: number
    question?: string
}

export function Portfolio() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { user } = useAppSelector(state => state.userModule)

    const [enrichedPortfolio, setEnrichedPortfolio] = useState<EnrichedPosition[]>([])
    const [perfData, setPerfData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [timeRange, setTimeRange] = useState<'1d' | '1w' | '1m' | 'all'>('1w')
    console.log(user?.portfolio)
    useEffect(() => {
        if (user?.portfolio && user.portfolio.length > 0) {
            loadPortfolioData()
        } else {
            setEnrichedPortfolio([])
            setPerfData(null)
        }
    }, [user?.portfolio, user?.cash, timeRange])

    // הוסף את פונקציית העזר הזו מחוץ לקומפוננטה או בתוכה
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    async function loadPortfolioData() {
        if (!user || !user.portfolio) return
        setIsLoading(true)

        try {
            const enriched: EnrichedPosition[] = []

            // 1. טעינת נתונים אחד-אחד למניעת 429 (Too Many Requests) ב-GitHub Pages
            for (const pos of user.portfolio) {
                try {
                    const market = await eventService.fetchMarketById(pos.marketId)
                    if (market) {
                        const idx = market.outcomes.indexOf(pos.outcome)
                        enriched.push({
                            ...pos,
                            question: market.question,
                            currentPrice: market.outcomePrices[idx]
                        })
                    } else {
                        enriched.push(pos)
                    }
                    await delay(150) // השהיה קריטית ל-CORS Proxy
                } catch (err) {
                    console.error(`Error fetching market ${pos.marketId}:`, err)
                    enriched.push(pos)
                }
            }
            setEnrichedPortfolio(enriched)

            // 2. חישוב ערכים נוכחיים
            let livePositionsValue = 0
            let totalCost = 0
            enriched.forEach(pos => {
                if (pos.currentPrice !== undefined) {
                    livePositionsValue += (pos.currentPrice / 100) * pos.shares
                    totalCost += (pos.avgPrice / 100) * pos.shares
                }
            })

            const currentCash = user.cash || 0
            const liveTotalEquity = livePositionsValue + currentCash
            const totalPnl = livePositionsValue - totalCost
            const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

            // 3. משיכת היסטוריה
            const performance = await eventService.getPerformance(user.portfolio, timeRange)
            const rawEvents: any[] = performance?.history || []

            const sortedEvents = [...rawEvents].sort((a, b) => {
                const tA = a.timestamp || a.time || 0
                const tB = b.timestamp || b.time || 0
                return tA - tB
            })

            const history: any[] = []
            let lastAddedTimestamp = 0
            const THIRTY_MINUTES_MS = 30 * 60 * 1000 // דילול חצי שעה

            // --- נקודת התחלה: קריטית לצבע הגרף ---
            if (totalCost > 0) {
                history.push({
                    name: 'start',
                    date: 'Purchase Price',
                    value: Number((totalCost + currentCash).toFixed(2))
                })
            }

            const marketValues: Record<string, number> = {}

            // 4. בניית נקודות הגרף
            sortedEvents.forEach((event, index) => {
                const mId = event.marketId || 'default'
                const val = event.value > 100 ? event.value / 100 : event.value
                marketValues[mId] = val

                const rawTime = event.timestamp || event.time
                const timestamp = rawTime < 10000000000 ? rawTime * 1000 : rawTime

                // דילול
                const isLastEvent = index === sortedEvents.length - 1
                if (!isLastEvent && (timestamp - lastAddedTimestamp < THIRTY_MINUTES_MS)) return

                const eventTime = new Date(timestamp)
                if (eventTime.getFullYear() < 2024) return

                lastAddedTimestamp = timestamp
                const positionsValueAtTime = Object.values(marketValues).reduce((sum, v) => sum + v, 0)

                history.push({
                    name: index.toString(),
                    date: eventTime.toLocaleDateString() + ' ' + eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: Number((positionsValueAtTime + currentCash).toFixed(2))
                })
            })

            // --- נקודת LIVE סופית ---
            history.push({
                name: 'live',
                date: 'Now',
                value: Number(liveTotalEquity.toFixed(2))
            })

            setPerfData({
                stats: { currentTotalValue: liveTotalEquity, totalPnl, pnlPercent },
                history: history.filter((v, i, a) => a.findIndex(t => t.date === v.date) === i)
            })

        } catch (err) {
            console.error("Portfolio load error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    // בתוך ה-return של הקומפוננטה, החלף את ה-chart-wrapper לזה:
    <div className="chart-wrapper" style={{ width: '100%', height: '300px', minHeight: '300px', position: 'relative' }}>
        {!isLoading && perfData?.history?.length > 0 ? (
            <PortfolioChart data={perfData.history} />
        ) : (
            <div className="flex align-center justify-center" style={{ height: '100%', color: '#666' }}>
                {isLoading ? "Fetching Market Data..." : "No data available"}
            </div>
        )}
    </div>
    function onSell(ev: React.MouseEvent, eventId?: string, outcome?: string, method?: 'market' | 'limit') {
        ev.stopPropagation()
        dispatch(setTradingDirection('sell'))
        dispatch(setSelectedOutcome(outcome || ''))
        dispatch(setTradingMethod(method || 'market'))
        if (eventId) navigate(`/event/${eventId}`)
    }

    function onDeposit() {
        if (user) dispatch(setModalType('DEPOSIT'))
        else dispatch(setModalType('AUTH'))
    }

    return (
        <section className="portfolio container">
            <div className="portfolio-top-layout">
                <div className="summary-section">
                    <div className="equity-header">
                        <div className="summary-item">
                            <span className="label-main">Total Equity</span>
                            <div className="equity-value">
                                ${(perfData?.stats?.currentTotalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>

                        <div className="summary-item cash-item">
                            <span className="label-main">Cash</span>
                            <div className="cash-container flex align-center" style={{ gap: '15px', marginTop: '4px' }}>
                                <div className="cash-value" style={{ fontSize: '24px', fontWeight: '600', color: '#495057' }}>
                                    ${(user?.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <button className="signup-link deposit-btn" onClick={onDeposit}>
                                    Deposit
                                </button>
                            </div>
                        </div>
                    </div>

                    {perfData?.stats && (
                        <div className={`pnl-badge-modern ${perfData.stats.totalPnl >= 0 ? 'pos' : 'neg'}`}>
                            {perfData.stats.totalPnl >= 0 ? '▲' : '▼'}
                            ${Math.abs(perfData.stats.totalPnl).toFixed(2)}
                            ({Math.abs(perfData.stats.pnlPercent).toFixed(1)}%)
                        </div>
                    )}
                </div>

                <div className="chart-wrapper" style={{ width: '100%', height: '300px', minHeight: '300px' }}>
                    {perfData?.history?.length > 0 && <PortfolioChart data={perfData.history} />}
                </div>

                <div className="time-filters">
                    {(['1d', '1w', '1m', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            type="button"
                            onClick={() => setTimeRange(range)}
                            className={`filter-btn ${timeRange === range ? 'active' : ''}`}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="positions container">
                <h3 className="section-title">Positions</h3>
                <div className="positions-header">
                    <div>Market</div>
                    <div>Order Type</div>
                    <div>Outcome</div>
                    <div>Shares</div>
                    <div>Avg Price</div>
                    <div>Current Price</div>
                    <div>Value</div>
                    <div>P&L</div>
                </div>

                <ul className="positions-list">
                    {!enrichedPortfolio.length && !isLoading && <div className="empty-portfolio">No open positions</div>}
                    {enrichedPortfolio.map((position) => {
                        const pnl = position.currentPrice ? (position.currentPrice - position.avgPrice) * position.shares : 0
                        return (
                            <li key={`${position.marketId}-${position.outcome}`} className="position-raw">
                                <div className="event-name" onClick={() => navigate(`/event/${position.eventId}`)}>{position.question}</div>
                                <div>{position.orderType}</div>
                                <div>{position.outcome}</div>
                                <div>{position.shares?.toFixed(0)}</div>
                                <div>{position.avgPrice.toFixed(2)}¢</div>
                                <div>{position.currentPrice ? `${position.currentPrice}¢` : '--'}</div>
                                <div>{position.currentPrice ? `$${(position.currentPrice / 100 * position.shares).toFixed(2)}` : '--'}</div>
                                <div style={{ color: pnl >= 0 ? '#00aa5d' : '#ff4d4d', fontWeight: 'bold' }}>
                                    {position.currentPrice ? `${(pnl / 100).toFixed(2)}$` : '--'}
                                </div>
                                <div className="sell-btn" onClick={(ev) => onSell(ev, position.eventId, position.outcome, position.orderType)}>Sell</div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}