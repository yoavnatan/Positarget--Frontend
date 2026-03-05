import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { searchEvents } from "../services/event/event.service.local";
import { useCallback, useEffect, useRef, useState } from "react";
import { Event } from "../types/event";
import Arrow from '../assets/svg/drop-arrow.svg?react'
import SearchIcon from '../assets/svg/search.svg?react'

export function Search() {
    const [searchParams] = useSearchParams();
    const [searchResults, setSearchResults] = useState<Event[]>([]);
    const [serachTerm, setSearchTerm] = useState('')
    const [visibleCount, setVisibleCount] = useState(15);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const navigate = useNavigate();
    const query = searchParams.get('q');
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (!query) return;

        setSearchTerm(query);
        setVisibleCount(15);

        async function fetchResults() {
            try {
                if (query) {
                    const results = await searchEvents(query);
                    setSearchResults(results);
                }
            } catch (err) {
                console.error('Search failed', err);
            }
        }

        fetchResults();
    }, [query]);

    const loadMore = useCallback(() => {
        if (isLoadingMore || visibleCount >= searchResults.length) return;

        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => prev + 15);
            setIsLoadingMore(false);
        }, 600);
    }, [isLoadingMore, visibleCount, searchResults.length]);

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        }, { threshold: 0.1 });

        if (node) observer.current.observe(node);
    }, [loadMore, isLoadingMore, query, searchResults]);

    function hadnleSearchInput(value: string) {
        setSearchTerm(value)
    }

    async function onSearch() {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('q', serachTerm);
        navigate(`/search?${newSearchParams.toString()}`);
    }

    function getOutcomes(event: Event) {
        if (!event.markets || event.markets.length === 0) return { price: 0, outcome: '' };
        const market = event.markets[0];
        if (!market.outcomes || market.outcomes.length === 0) return { price: 0, outcome: '' };

        if (market.outcomes[0] !== 'Yes') {
            const maxIdx = market.outcomePrices.reduce((maxIdx, price, idx, arr) => price > arr[maxIdx] ? idx : maxIdx, 0);
            return { price: market.outcomePrices[maxIdx], outcome: market.outcomes[maxIdx] }
        } else {
            return { price: market.outcomePrices[0], outcome: '' }
        }
    }

    return (
        <section className="search-page">
            <div className="search-results">
                <h3 className="header">Search results for: <span>{query}</span></h3>

                {searchResults.length > 0 ? (
                    <>
                        <ul className="search-results-list">
                            {searchResults.slice(0, visibleCount).map(event =>
                                <li key={event._id} className="search-result-item">
                                    <header>
                                        <div className="event-info flex">
                                            <img src={event.imgUrl} alt={event.title} />
                                            <div className="inner-info">
                                                <div className="event-labels">
                                                    {event.labels.slice(0, 2).map(label => (
                                                        <span key={label} className="event-label">{label}</span>
                                                    ))}
                                                </div>
                                                <div className="event-title">
                                                    <Link to={`/event/${event._id}`}>{event.title}</Link>
                                                </div>
                                                <div className="volume">Vol ${event.volume.toLocaleString()} </div>
                                            </div>
                                            <div className="odds">
                                                <div className="price">{getOutcomes(event).price}%</div>
                                                <div className="outcome">{getOutcomes(event).outcome}</div>
                                            </div>
                                            <Arrow className="icon arrow" />
                                        </div>
                                    </header>
                                </li>
                            )}
                        </ul>

                        {/*לטעינה הדרגתית */}
                        {visibleCount < searchResults.length && (
                            <div ref={lastElementRef} className="loader-container" style={{ height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {isLoadingMore && <p>Loading more events...</p>}
                            </div>
                        )}
                    </>
                ) : (
                    <p>No results found... Try to search for something else</p>
                )}
            </div>

            <div className="search-sticky-menu">
                <form className="search-form flex" onSubmit={(ev) => {
                    ev.preventDefault();
                    onSearch();
                }}>
                    <input
                        type="text"
                        placeholder="Search"
                        value={serachTerm}
                        onChange={(ev) => hadnleSearchInput(ev.target.value)}
                    />
                    <SearchIcon className="icon search medium" />
                </form>
            </div>
        </section>
    );
}