import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { searchEvents } from "../services/event/event.service.local";
import { useCallback, useEffect, useRef, useState } from "react";
import { Event } from "../types/event";
import Arrow from '../assets/svg/drop-arrow.svg?react'
import SearchIcon from '../assets/svg/search.svg?react'
import New from '../assets/svg/new.svg?react'
import Popular from '../assets/svg/fire.svg?react'
import Trending from '../assets/svg/trending.svg?react'

export function Search() {
    const [searchParams] = useSearchParams();
    const [searchResults, setSearchResults] = useState<Event[]>([]);
    const [serachTerm, setSearchTerm] = useState('')
    const [visibleCount, setVisibleCount] = useState(15);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [filterBy, setFilterBy] = useState<string>()
    const [originalResults, setOriginalResults] = useState<Event[]>([]);
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
                    setOriginalResults(results);
                }
            } catch (err) {
                console.error('Search failed', err);
            }

        }

        fetchResults();
    }, [query]);

    useEffect(() => {
        const sortFromUrl = searchParams.get('sort');
        if (sortFromUrl) {
            setFilterBy(sortFromUrl);
        } else {
            console.log('hi')

            setFilterBy(''); // ברירת מחדל אם אין ב-URL
            setSearchResults(originalResults); // החזרת התוצאות למצב המקורי
        }
    }, [searchParams]);

    useEffect(() => {
        console.log('Filtering by:', filterBy);
        if (filterBy === "Volume") {
            setSearchResults(prev => [...prev].sort((a, b) => b.volume - a.volume));
        } else if (filterBy === "Newest") {
            setSearchResults(prev => [...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } else if (filterBy === "Trending") {
            setSearchResults(prev => [...prev].sort((a, b) => b.volume / ((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)) - a.volume / ((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60))));
        }
    }, [filterBy])


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

    function onSortBy(ev: React.MouseEvent<HTMLDivElement>) {
        const text = ev.currentTarget.textContent?.trim() || '';
        const newParams = new URLSearchParams(searchParams);

        if (filterBy === text) {
            newParams.delete('sort');
        } else {
            newParams.set('sort', text);
        }

        navigate(`/search?${newParams.toString()}`);
    }

    console.log(searchResults)

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
                <h5 className="sort-by header">Sort by</h5>
                <div className="sorting-options flex">
                    <div className={`sort-item flex ${filterBy === 'Trending' ? "active" : ''}`} onClick={onSortBy}><Trending />Trending</div>
                    <div className={`sort-item flex ${filterBy === 'Newest' ? "active" : ''}`} onClick={onSortBy}><New />Newest</div>
                    <div className={`sort-item flex ${filterBy === 'Volume' ? "active" : ''}`} onClick={onSortBy}><Popular />Volume</div>
                </div>
            </div>
        </section>
    );
}