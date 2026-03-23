import { Link, useNavigate } from 'react-router-dom'
import { Event, Market } from '../types/event'
import PieChartWithPaddingAngle from './pieChart'
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";
import { useAppDispatch, useAppSelector } from '../store/store';
import { userService } from '../services/user';
import { setMsg } from '../store/slices/system.slice';
import { setSelectedMarketId, setSelectedOutcome, updateUser } from '../store/slices/user.slice';
import React, { useState } from 'react';

export function EventPreview({ event }: { event: Event }) {
    const [isImgLoaded, setIsImgLoaded] = useState(false)

    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { user } = useAppSelector(state => state.userModule)

    const isSportMarket = (market: Market) => {
        const text = market.outcomes?.[0]?.toLowerCase()
        return text && !['yes', 'up', 'no', 'down'].includes(text)
    }

    const formatPrice = (price: number | string) => {
        const numPrice = parseFloat(price.toString())
        if (isNaN(numPrice)) return '0%'
        if (numPrice >= 0 && numPrice <= 1) return '<1%'
        if (numPrice >= 99) return '100%'
        return `${Math.round(numPrice)}%`
    }

    const getUniqueName = (market: Market, allMarkets: Market[]): string => {
        const questions = allMarkets.map(m => m.question || "")
        if (questions.length <= 1) return market.outcomes[0] || 'Market'
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
        return unique || market.outcomes[0] || 'Market'
    }

    const getBtnClass = (outcome: string) => {
        const text = outcome.toLowerCase()
        if (text === 'yes' || text === 'up') return 'yes'
        if (text === 'no' || text === 'down') return 'no'
        return 'sport'
    }

    async function saveToFavorites(ev: React.MouseEvent, eventId: string) {
        ev.stopPropagation()
        if (!user) dispatch(setMsg({ txt: 'Please login, to save this market', type: 'error' }))
        if (user) {
            const isFavorite = user.favoriteEvents?.includes(eventId);
            const updatedFavoriteEvents = isFavorite
                ? user.favoriteEvents!.filter(id => id !== eventId)
                : [...(user.favoriteEvents || []), eventId];

            const updatedUser = { ...user, favoriteEvents: updatedFavoriteEvents };
            try {
                await dispatch(updateUser(updatedUser)).unwrap();
            } catch (err) {
                dispatch(setMsg({ txt: 'Failed to save to favorites', type: 'error' }))
            }
        }
    }

    function onAnswerClicked(ev: React.MouseEvent, idx: number, marketId: string, outcome: string) {
        ev.stopPropagation()
        dispatch(setSelectedOutcome(outcome))
        dispatch(setSelectedMarketId(marketId))
        navigate(`/event/${event._id}`)
    }

    // --- לוגיקה חדשה: קודם כל מנקים מרקטים שבורים טכנית ---
    const validMarkets = event.markets.filter(m => m.outcomes?.length >= 2 && m.outcomePrices?.length >= 1)

    // --- עכשיו ממינים: אלו שביניהם יש מחיר "חי" (1-99) עולים למעלה ---
    const sortedMarkets = [...validMarkets].sort((a, b) => {
        const aIsActive = a.outcomePrices.some(p => parseFloat(p.toString()) > 1 && parseFloat(p.toString()) < 99) ? 1 : 0
        const bIsActive = b.outcomePrices.some(p => parseFloat(p.toString()) > 1 && parseFloat(p.toString()) < 99) ? 1 : 0
        return bIsActive - aIsActive // פעילים קודם
    })

    // המרקט הראשי יהיה הראשון מהרשימה הממוינת (או המקורי אם הכל ריק)
    const currentMainMarket = sortedMarkets[0] || event.markets[0]
    const isBinary = currentMainMarket?.outcomes.includes('Yes') || currentMainMarket?.outcomes.includes('Up')
    const isSingleMarket = event.markets.length === 1

    const displayedMarkets = (currentMainMarket && isSportMarket(currentMainMarket))
        ? sortedMarkets.slice(0, 1)
        : sortedMarkets.slice(0, 5)

    return (
        <article className="event-preview">
            <header>
                <div className="event-info flex">
                    <img
                        src={event.imgUrl}
                        alt={event.title}
                        onLoad={() => setIsImgLoaded(true)}
                        style={{
                            opacity: isImgLoaded ? 1 : 0,
                            transition: 'opacity 0.5s ease-in-out',
                        }}
                    />
                    <Link to={`/event/${event._id}`} className="event-title">{event.title}</Link>

                    {isBinary && isSingleMarket && currentMainMarket && (
                        <div className="odds">
                            <div className="pie">
                                <PieChartWithPaddingAngle
                                    yes={currentMainMarket.outcomePrices[0] || 0}
                                    no={currentMainMarket.outcomePrices[1] || 0}
                                />
                            </div>
                            <div className="odds-info">
                                <span className="number">{formatPrice(currentMainMarket.outcomePrices[0] || 0)}</span>
                                <span className="text">chance</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="options">
                {sortedMarkets.length > 1 && currentMainMarket && !isSportMarket(currentMainMarket) ? (
                    <div className="multi-options">
                        {displayedMarkets.map((market) => (
                            <div key={market.id} className="option flex space-between">
                                <span className="option-name" onClick={(ev) => onAnswerClicked(ev, 0, market.id, market.outcomes[0])}>
                                    {getUniqueName(market, sortedMarkets)}
                                </span>
                                <div className="market-btns flex">
                                    {market.outcomes.slice(0, 2).map((outcome, idx) => {
                                        const btnCls = getBtnClass(outcome)
                                        return (
                                            <div key={idx} className="btn-group flex">
                                                {idx === 0 && <span className="price-label">{formatPrice(market.outcomePrices[idx])}</span>}
                                                <button className={`action-btn ${btnCls}`} onClick={(ev) => onAnswerClicked(ev, idx, market.id, outcome)}>
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
                    currentMainMarket && (
                        <div className="binary-options flex">
                            {currentMainMarket.outcomes.slice(0, 2).map((outcome, idx) => {
                                const btnCls = getBtnClass(outcome)
                                const isSport = btnCls === 'sport'
                                return (
                                    <div key={idx} className="btn-group justify-center">
                                        {isSport && <span className="btn-price">{formatPrice(currentMainMarket.outcomePrices[idx])}</span>}
                                        <button className={`action-btn ${btnCls}`} onClick={(ev) => onAnswerClicked(ev, idx, currentMainMarket.id, outcome)}>
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
                        <span className="value"> ${(event.volume || 0).toLocaleString()}</span>
                    </div>
                    {(!user?.favoriteEvents || !user?.favoriteEvents.includes(event._id)) && (
                        <span className="category-tag" onClick={(ev) => saveToFavorites(ev, event._id)}>
                            <IoBookmarkOutline />
                        </span>
                    )}
                    {user?.favoriteEvents && user?.favoriteEvents.includes(event._id) && (
                        <span className="category-tag" onClick={(ev) => saveToFavorites(ev, event._id)}>
                            <IoBookmark className="icon full" />
                        </span>
                    )}
                </div>
            </footer>
        </article>
    )
}