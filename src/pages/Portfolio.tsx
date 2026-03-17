import { useEffect, useState } from "react"
import { eventService } from "../services/event"
import { useAppDispatch, useAppSelector } from "../store/store"
import { Position } from "../types/user.type"
import { useNavigate } from "react-router"
import { setSelectedOutcome, setTradingDirection } from "../store/slices/user.slice"

// הגדרת טיפוס חדש שכולל את המחיר העדכני
interface EnrichedPosition extends Position {
    currentPrice?: number
    question?: string
}

export function Portfolio() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { user } = useAppSelector(state => state.userModule)
    const [enrichedPortfolio, setEnrichedPortfolio] = useState<EnrichedPosition[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (user?.portfolio?.length) {
            loadMarketPrices()
        }
    }, [user?.portfolio])

    async function loadMarketPrices() {
        if (!user?.portfolio) return
        setIsLoading(true)

        try {
            // מבצעים את כל הקריאות ל-API במקביל
            const enriched = await Promise.all(
                user.portfolio.map(async (position) => {
                    const market = await eventService.fetchMarketById(position.marketId)
                    if (market) {
                        console.log(market)
                        const idx = market.outcomes.indexOf(position.outcome)
                        return {
                            ...position,
                            question: market.question,
                            currentPrice: market.outcomePrices[idx]
                        }
                    }
                    return position
                })
            )
            setEnrichedPortfolio(enriched)
        } catch (err) {
            console.error("Failed to load portfolio prices", err)
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

    console.log("Enriched Portfolio:", enrichedPortfolio)

    return (
        <section className="portfolio container">
            <div className="cash-info">
                {/* <strong>Cash:</strong> ${user?.cash?.toLocaleString() || 0} */}
            </div>

            <h3>Positions</h3>
            <div className="positions-header">
                <div>Market</div>
                <div>Outcome</div>
                <div>Shares</div>
                <div>Avg Price</div>
                <div>Current Price</div>
                <div>Value</div>
                <div>P&L</div>
            </div>

            {isLoading && <p>Updating prices...</p>}
            {enrichedPortfolio.length === 0 && !isLoading && <div className="empty-portfolio">No positions found</div>}
            <ul className="positions-list">
                {/* משתמשים ב-enrichedPortfolio אם הוא קיים, אחרת בפורטפוליו הרגיל */}
                {(enrichedPortfolio.length ? enrichedPortfolio : (user?.portfolio || [])).map((position: EnrichedPosition) => {
                    const pnl = position.currentPrice
                        ? (position.currentPrice - position.avgPrice) * position.shares
                        : 0

                    return (

                        <li key={`${position.marketId}-${position.outcome}`} className="position-raw">
                            <div className="event-name" onClick={() => navigate(`/event/${position.eventId}`)}>{position.question}</div>
                            <div>{position.outcome}</div>
                            <div>{position.shares?.toFixed(0)}</div>
                            <div>{position.avgPrice}¢</div>
                            <div>{position.currentPrice ? `${position.currentPrice}¢` : '--'}</div>
                            <div>{position.currentPrice && position.shares ? `${position.currentPrice / 100 * position.shares}$` : '--'}</div>
                            <div style={{ color: pnl >= 0 ? 'green' : 'red' }}>
                                {position.currentPrice ? `${(pnl / 100).toFixed(2)}$` : '--'}
                            </div>
                            <div className="sell-btn" onClick={(ev) => onSell(ev, position.eventId, position.outcome)}>Sell</div>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}