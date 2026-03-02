import { Link } from 'react-router-dom'
import { Event, Market } from '../types/event'
import PieChartWithPaddingAngle from './pieChart'

export function EventPreview({ event }: { event: Event }) {
    const mainMarket = event.markets?.[0]
    const isBinary = mainMarket?.outcomes.includes('Yes') || mainMarket?.outcomes.includes('Up')
    const isSingleMarket = event.markets.length === 1 && mainMarket

    // פונקציית עזר לבדיקה אם מדובר בספורט לפי ה-Outcome הראשון
    const isSportMarket = (market: Market) => {
        const text = market.outcomes[0]?.toLowerCase()
        return !['yes', 'up', 'no', 'down'].includes(text)
    }

    const formatPrice = (price: any) => {
        const numPrice = parseFloat(price)
        if (isNaN(numPrice)) return '0%'
        if (numPrice >= 0 && numPrice < 1) return '<1%'
        return `${Math.round(numPrice)}%`
    }

    const getUniqueName = (market: Market, allMarkets: Market[]): string => {
        const questions = allMarkets.map(m => m.question || "")
        if (questions.length <= 1) return market.outcomes[0]
        const titleWords = event.title.toLowerCase().split(' ')
        const wordArrays = questions.map(q => q.toLowerCase().replace(/\?|,/g, '').split(' '))
        const commonWords = wordArrays[0].filter((word: string) => {
            const count = wordArrays.filter(arr => arr.includes(word)).length
            return count > wordArrays.length / 2 || titleWords.includes(word)
        })
        const blacklist = ['will', 'be', 'win', 'won', 'the', 'a', 'an', 'is', 'to', 'of', 'in', 'at', 'by', 'on', 'for', 'with', 'and', 'or', 'but', 'next', 'as', 'who', 'price', 'above']
        const unique = market.question.split(' ').filter((word: string) => {
            const cleanWord = word.toLowerCase().replace(/\?|,/g, '')
            return !commonWords.includes(cleanWord) && !blacklist.includes(cleanWord)
        }).join(' ').replace(/\?/g, '').trim()
        return unique || market.outcomes[0]
    }

    const getBtnClass = (outcome: string) => {
        const text = outcome.toLowerCase()
        if (text === 'yes' || text === 'up') return 'yes'
        if (text === 'no' || text === 'down') return 'no'
        return 'sport'
    }

    // החלטה כמה מרקטים להציג: אם הראשון הוא ספורט, נציג רק 1. אחרת (פוליטיקה/קריפטו) נציג עד 5.
    const displayedMarkets = (mainMarket && isSportMarket(mainMarket))
        ? event.markets.slice(0, 1)
        : event.markets.slice(0, 5)

    return (
        <article className="event-preview">
            <header>
                <div className="event-info flex">
                    <img src={event.imgUrl} alt={event.title} />
                    <Link to={`/event/${event._id}`} className="event-title">{event.title}</Link>

                    {isBinary && isSingleMarket && (
                        <div className="odds">
                            <div className="pie">
                                <PieChartWithPaddingAngle
                                    yes={mainMarket.outcomePrices[0] || 0}
                                    no={mainMarket.outcomePrices[1] || 0}
                                />
                            </div>
                            <div className="odds-info">
                                <span className="number">{formatPrice(mainMarket.outcomePrices[0] || 0)}</span>
                                <span className="text">chance</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="options">
                {event.markets.length > 1 && !isSportMarket(mainMarket!) ? (
                    <div className="multi-options">
                        {displayedMarkets.map((market) => (
                            <div key={market.id} className="option flex space-between">
                                <span className="option-name">{getUniqueName(market, event.markets)}</span>
                                <div className="market-btns flex items-center gap-10">
                                    {market.outcomes.slice(0, 2).map((outcome, idx) => {
                                        const btnCls = getBtnClass(outcome)
                                        return (
                                            <div key={idx} className="btn-group flex">
                                                {idx === 0 && <span className="price-label">{formatPrice(market.outcomePrices[idx])}</span>}
                                                <button className={`action-btn ${btnCls}`}>
                                                    <span className="btn-text">{outcome}</span>
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    mainMarket && (
                        <div className="binary-options flex">
                            {mainMarket.outcomes.slice(0, 2).map((outcome, idx) => {
                                const btnCls = getBtnClass(outcome)
                                const isSport = btnCls === 'sport'
                                return (
                                    <div key={idx} className="btn-group justify-center">
                                        {isSport && <span className="btn-price">{formatPrice(mainMarket.outcomePrices[idx])}</span>}
                                        <button className={`action-btn ${btnCls}`}>
                                            <span className="btn-text">{outcome}</span>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )
                )}
            </main>

            <footer>
                <div className="event-footer flex space-between">
                    <div className="volume-info">
                        <span className="label">Vol.</span>
                        <span className="value">${(event.volume || 0).toLocaleString()}</span>
                    </div>
                    <span className="category-tag">{event.category}</span>
                </div>
            </footer>
        </article>
    )
}