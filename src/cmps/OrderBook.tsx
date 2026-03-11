import { useEffect, useRef, useState } from "react";
import { Market, OrderbookLevel } from "../types/event";
import Arrow from '../assets/svg/drop-arrow.svg?react'
import Center from '../assets/svg/center.svg?react'
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
    const displayedAsksRef = useRef<OrderbookLevel[]>([]);

    const { selectedOutcome } = useAppSelector((state: RootState) => state.userModule)

    let selectedOutcomeIndex = selectedOutcome === 'Yes' ? 0 : selectedOutcome === 'No' ? 1 : null;
    if (selectedOutcomeIndex === null) {
        selectedOutcomeIndex = market?.outcomes.findIndex(outcome => outcome.toLowerCase() === selectedOutcome.toLowerCase()) ?? null;
    }

    useEffect(() => {
        let isMounted = true;
        if (!market?.clobTokenIds?.length) return;

        const loadOrderBooks = async () => {
            try {
                setHasNoBook(false);
                const books = await Promise.all(
                    market.clobTokenIds.map(id => eventService.fetchOrderBook(id))
                );

                if (!isMounted) return;

                const currentBook = books[selectedOutcomeIndex ?? 0];

                if (!currentBook || (currentBook as any).error || (!currentBook.asks?.length && !currentBook.bids?.length)) {
                    setHasNoBook(true);
                    setAsks([]);
                    setBids([]);
                    return;
                }

                setAsks(currentBook.asks || []);
                setBids(currentBook.bids || []);
            } catch (err) {
                if (isMounted) {
                    setHasNoBook(true);
                    console.error('Fetch failed');
                }
            }
        };

        loadOrderBooks();

        return () => { isMounted = false };
    }, [market.id, selectedOutcomeIndex]);

    // גלול לאמצע אוטומטית כשנתונים חדשים נטענים
    useEffect(() => {
        if (!asks.length && !bids.length) return;

        const table = tableRef.current;
        if (!table) return;

        setTimeout(() => {
            const rowHeight = 28;
            const numberOfAsks = displayedAsksRef.current.length;
            const spreadTop = numberOfAsks * rowHeight;
            const spreadHeight = 35;
            const containerHalfHeight = table.clientHeight / 2;

            table.scrollTo({
                top: spreadTop - containerHalfHeight + (spreadHeight / 2),
                behavior: 'auto'
            });
        }, 0);
    }, [asks, bids]);

    function scrollToSpread() {
        const table = tableRef.current;
        if (!table) return;

        const rowHeight = 28;
        const numberOfAsks = displayedAsksRef.current.length;
        const spreadTop = numberOfAsks * rowHeight;
        const spreadHeight = 35;
        const containerHalfHeight = table.clientHeight / 2;

        table.scrollTo({
            top: spreadTop - containerHalfHeight + (spreadHeight / 2),
            behavior: 'smooth'
        });
    }

    const displayedAsks = asks;
    const displayedBids = bids;
    displayedAsksRef.current = displayedAsks;

    const maxTotal = Math.max(
        ...displayedAsks.map(a => a.total),
        ...displayedBids.map(b => b.total),
        1
    );

    return (
        <section className={`order-book container ${isBookOpen ? 'open' : ''}`}>
            <header className="order-book-header flex" onClick={() => setIsBookOpen(prev => !prev)}>
                <h2 className="order-book-title">Order Book</h2>
                <div className="btn-toggle">
                    <Arrow className={`arrow ${isBookOpen ? 'open' : ''}`} />
                </div>
            </header>
            <main>
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
                    </div>

                    <div className="table-header">
                        <span className="trade-header uppercase">
                            TRADE {market.outcomes[selectedOutcomeIndex ?? 0]}
                            <div className="icon-wrapper" onClick={scrollToSpread}>
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
                                    {[...displayedAsks].reverse().map((ask, i) => (
                                        <div key={i} className="row ask-row">
                                            <span
                                                className="side sell"
                                                style={{ backgroundSize: `${((displayedAsks.length - i) / displayedAsks.length) * 100}% 100%` }}
                                            ></span>
                                            <span className="price">{(ask.price * 100).toFixed(0)}¢</span>
                                            <span className="shares">{ask.size.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span className="total-in-row">${(ask.total * ask.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="center-divider" ref={spreadRef}>
                                    <span>Spread: {asks[0] && bids[0] ? ((asks[0].price - bids[0].price) * 100).toFixed(0) : 0}¢</span>
                                </div>

                                <div className="table bids">
                                    {displayedBids.map((bid, i) => (
                                        <div key={i} className="row bid-row">
                                            <span
                                                className="side buy"
                                                style={{ backgroundSize: `${(bid.total / maxTotal) * 100}% 100%` }}
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