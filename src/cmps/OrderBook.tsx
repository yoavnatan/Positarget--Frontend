import { useEffect, useRef, useState } from "react";
import { Market, OrderbookLevel } from "../types/event";
import Arrow from '../assets/svg/drop-arrow.svg?react'
import Center from '../assets/svg/center.svg?react'
import Refresh from '../assets/svg/refresh.svg?react'
import { RootState, useAppDispatch, useAppSelector } from "../store/store";
import { setSelectedOutcome } from "../store/slices/user.slice";
import { eventService } from "../services/event";

export function OrderBook(market: Market) {
    const dispatch = useAppDispatch()
    const [isBookOpen, setIsBookOpen] = useState(false);
    const [asks, setAsks] = useState<OrderbookLevel[]>([]);
    const [bids, setBids] = useState<OrderbookLevel[]>([]);
    const [hasNoBook, setHasNoBook] = useState(false);
    const spreadRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const isInitialLoad = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const { selectedOutcome } = useAppSelector((state: RootState) => state.userModule)

    let selectedOutcomeIndex = selectedOutcome === 'Yes' ? 0 : selectedOutcome === 'No' ? 1 : null;
    if (selectedOutcomeIndex === null) {
        selectedOutcomeIndex = market?.outcomes.findIndex(outcome => outcome.toLowerCase() === selectedOutcome.toLowerCase()) ?? null;
    }

    useEffect(() => {
        if (!market?.clobTokenIds?.length) return;
        loadOrderBooks();
    }, [market.id, selectedOutcomeIndex]);

    useEffect(() => {
        scrollToSpread();
    }, [isBookOpen])
    async function loadOrderBooks() {
        if (!market.clobTokenIds) return;

        setIsLoading(true);
        isInitialLoad.current = true;
        setHasNoBook(false);

        try {
            const tokenId = market.clobTokenIds[selectedOutcomeIndex ?? 0];

            if (!tokenId) {
                setHasNoBook(true);
                return;
            }

            const currentBook = await eventService.fetchOrderBook(tokenId);

            if (!currentBook || (currentBook as any).error || (!currentBook.asks?.length && !currentBook.bids?.length)) {
                setHasNoBook(true);
                setAsks([]);
                setBids([]);
                return;
            }

            // עיבוד הנתונים (מיון וחישוב Cumulative Total)
            const sortedAsks = [...(currentBook.asks || [])].sort((a, b) => a.price - b.price);
            const sortedBids = [...(currentBook.bids || [])].sort((a, b) => b.price - a.price);

            let cumulativeAsksTotal = 0;
            const processedAsks = sortedAsks.map(ask => {
                cumulativeAsksTotal += ask.size;
                return { ...ask, total: cumulativeAsksTotal };
            });

            let cumulativeBidsTotal = 0;
            const processedBids = sortedBids.map(bid => {
                cumulativeBidsTotal += bid.size;
                return { ...bid, total: cumulativeBidsTotal };
            });

            setAsks(processedAsks);
            setBids(processedBids);
        } catch (err) {
            setHasNoBook(true);
            console.error('Orderbook fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!asks.length && !bids.length) return;
        if (!isInitialLoad.current) return;
        isInitialLoad.current = false;
        scrollToSpread();
    }, [asks, bids]);

    function scrollToSpread() {
        const table = tableRef.current;
        if (!table) return;

        const rowHeight = 28;
        const numberOfAsks = asks.length;
        const spreadTop = numberOfAsks * rowHeight;
        const spreadHeight = 35;
        const containerHalfHeight = table.clientHeight / 2;

        table.scrollTo({
            top: spreadTop - containerHalfHeight + (spreadHeight / 2),
            behavior: 'auto'
        });
    }

    const maxAskTotal = asks.length > 0 ? asks[asks.length - 1].total : 1;
    const maxBidTotal = bids.length > 0 ? bids[bids.length - 1].total : 1;

    return (
        <section className={`order-book container ${isBookOpen ? 'open' : ''}`}>
            <header className="order-book-header flex" onClick={() => setIsBookOpen(prev => !prev)}>
                <h2 className="order-book-title">Order Book</h2>
                <div className="btn-toggle">
                    <Arrow className={`arrow ${isBookOpen ? 'open' : ''}`} />
                </div>
            </header>
            <main className={`order-book-main ${isBookOpen ? 'open' : ''}`}>
                <div className="inner-header">
                    <div className="inner-selector flex">
                        <span
                            className={`${selectedOutcomeIndex === 0 ? 'active' : ''}`}
                            onClick={() => dispatch(setSelectedOutcome('Yes'))}
                        >
                            Trade {market.outcomes[0]}
                        </span>
                        <span
                            className={`${selectedOutcomeIndex === 1 ? 'active' : ''}`}
                            onClick={() => dispatch(setSelectedOutcome('No'))}
                        >
                            Trade {market.outcomes[1]}
                        </span>
                        <div className="icon-wrapper">
                            <Refresh className={`refresh-icon ${isLoading ? "loading" : ''}`} onClick={loadOrderBooks} />
                        </div>
                    </div>

                    <div className="table-header">
                        <span className="trade-header uppercase">
                            TRADE {market.outcomes[selectedOutcomeIndex ?? 0]}
                            <div className="icon-wrapper" onClick={() => scrollToSpread()}>
                                <Center className="center-icon" />
                            </div>
                        </span>
                        <span>PRICE</span>
                        <span>SHARES</span>
                        <span>TOTAL</span>
                    </div>

                    <div className="order-book-table" ref={tableRef}>
                        {hasNoBook ? (
                            <div className="empty-state">
                                <p>No active orders for this outcome</p>
                                <span>Prices are driven by automated market makers</span>
                            </div>
                        ) : (
                            <>
                                <div className="table asks">
                                    {[...asks].reverse().map((ask, i) => (
                                        <div key={i} className="row ask-row">
                                            <span
                                                className="side sell"
                                                style={{ backgroundSize: `${(ask.total / maxAskTotal) * 100}% 100%` }}
                                            ></span>
                                            <span className="price">{(ask.price * 100).toFixed(0)}¢</span>
                                            <span className="shares">{ask.size.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span className="total-in-row">${(ask.total * ask.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="center-divider" ref={spreadRef}>
                                    <span>Last: {market.outcomePrices[selectedOutcomeIndex ?? 0]}¢ </span>
                                    <span>
                                        Spread: {asks[0] && bids[0] ? Math.abs((asks[0].price - bids[0].price) * 100).toFixed(1) : 0}¢
                                    </span>
                                </div>

                                <div className="table bids">
                                    {bids.map((bid, i) => (
                                        <div key={i} className="row bid-row">
                                            <span
                                                className="side buy"
                                                style={{ backgroundSize: `${(bid.total / maxBidTotal) * 100}% 100%` }}
                                            ></span>
                                            <span className="price">{(bid.price * 100).toFixed(0)}¢</span>
                                            <span className="shares">{bid.size.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            <span className="total-in-row">${(bid.total * bid.price).toFixed(2).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </section>
    );
}