import { useEffect, useState } from "react"
import { eventService } from "../services/event"
import { useAppDispatch, useAppSelector } from "../store/store"
import { Position } from "../types/user.type"
import { useNavigate } from "react-router"
import { setSelectedOutcome, setTradingDirection } from "../store/slices/user.slice"
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

    useEffect(() => {
        if (user?.portfolio && user.portfolio.length > 0) {
            loadPortfolioData()
        } else {
            setEnrichedPortfolio([])
            setPerfData(null)
        }
    }, [user?.portfolio, user?.cash, timeRange])

    async function loadPortfolioData() {
        if (!user || !user.portfolio) return

        setIsLoading(true)
        try {
            // 1. נתונים חיים לטבלה ולשורה האחרונה בגרף
            const enriched = await Promise.all(
                user.portfolio.map(async (pos): Promise<EnrichedPosition> => {
                    const market = await eventService.fetchMarketById(pos.marketId)
                    if (market) {
                        const idx = market.outcomes.indexOf(pos.outcome)
                        return { ...pos, question: market.question, currentPrice: market.outcomePrices[idx] }
                    }
                    return pos
                })
            )
            setEnrichedPortfolio(enriched)

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

            // 2. טיפול בהיסטוריה למניעת זיגזג
            const performance = await eventService.getPerformance(user.portfolio, timeRange)
            const rawEvents: any[] = performance?.history || []

            // מיון כרונולוגי קשיח
            const sortedEvents = [...rawEvents].sort((a, b) => {
                const timeA = new Date(a.timestamp || a.time).getTime()
                const timeB = new Date(b.timestamp || b.time).getTime()
                return timeA - timeB
            })

            const marketValues: Record<string, number> = {}
            const history: any[] = []

            sortedEvents.forEach((event, index) => {
                const mId = event.marketId || 'default'
                // וידוא שהערך הוא בדולרים (חלקי 100)
                const val = event.value > 100 ? event.value / 100 : event.value

                marketValues[mId] = val

                // חישוב שווי הפוזיציות המצטבר באותו רגע
                const positionsValueAtTime = Object.values(marketValues).reduce((sum, v) => sum + v, 0)

                // הוספת ה-Cash רק פעם אחת לכל נקודה
                const totalEquityAtTime = positionsValueAtTime + currentCash

                const eventTime = new Date(event.timestamp || event.time)
                history.push({
                    name: index.toString(),
                    date: eventTime.toLocaleDateString() + ' ' + eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    value: Number(totalEquityAtTime.toFixed(2))
                })
            })

            // 3. הוספת נקודת ה-LIVE המעודכנת ביותר
            const now = new Date()
            history.push({
                name: 'live',
                date: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                value: Number(liveTotalEquity.toFixed(2))
            })

            // ניקוי כפילויות אחרון אם בטעות נוצרו שתי נקודות על אותו זמן (למשל live ואירוע אחרון)
            const uniqueHistory = history.filter((v, i, a) => a.findIndex(t => t.date === v.date) === i)

            if (uniqueHistory.length === 1) {
                uniqueHistory.unshift({ ...uniqueHistory[0], name: '-1' })
            }

            setPerfData({
                stats: { currentTotalValue: liveTotalEquity, totalPnl, pnlPercent },
                history: uniqueHistory
            })
        } catch (err) {
            console.error("Portfolio load error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    function onSell(ev: React.MouseEvent, eventId?: string, outcome?: string) {
        ev.stopPropagation()
        dispatch(setTradingDirection('sell'))
        dispatch(setSelectedOutcome(outcome || ''))
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

                <div className="chart-wrapper" style={{ position: 'relative' }}>
                    <PortfolioChart data={perfData?.history || []} />
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
                    <div>Market</div><div>Outcome</div><div>Shares</div><div>Avg Price</div><div>Current Price</div><div>Value</div><div>P&L</div>
                </div>

                <ul className="positions-list">
                    {!enrichedPortfolio.length && !isLoading && <div className="empty-portfolio">No open positions</div>}
                    {enrichedPortfolio.map((position) => {
                        const pnl = position.currentPrice ? (position.currentPrice - position.avgPrice) * position.shares : 0
                        return (
                            <li key={`${position.marketId}-${position.outcome}`} className="position-raw">
                                <div className="event-name" onClick={() => navigate(`/event/${position.eventId}`)}>{position.question}</div>
                                <div>{position.outcome}</div>
                                <div>{position.shares?.toFixed(0)}</div>
                                <div>{position.avgPrice}¢</div>
                                <div>{position.currentPrice ? `${position.currentPrice}¢` : '--'}</div>
                                <div>{position.currentPrice ? `$${(position.currentPrice / 100 * position.shares).toFixed(2)}` : '--'}</div>
                                <div style={{ color: pnl >= 0 ? '#00aa5d' : '#ff4d4d', fontWeight: 'bold' }}>
                                    {position.currentPrice ? `${(pnl / 100).toFixed(2)}$` : '--'}
                                </div>
                                <div className="sell-btn" onClick={(ev) => onSell(ev, position.eventId, position.outcome)}>Sell</div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}