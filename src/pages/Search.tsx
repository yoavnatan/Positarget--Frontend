import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { eventService } from '../services/event'
import { useCallback, useEffect, useRef, useState } from "react";
import { Event } from "../types/event";
import Arrow from '../assets/svg/drop-arrow.svg?react'
import SearchIcon from '../assets/svg/search.svg?react'
import New from '../assets/svg/new.svg?react'
import Popular from '../assets/svg/fire.svg?react'
import Trending from '../assets/svg/trending.svg?react'
import { useAppDispatch, useAppSelector } from "../store/store";
import { loadEvents } from "../store/slices/event.slice";
import { searchEvents } from "../services/event/event.service.local";
import useClickOutside from "../customHooks/useClickOutside";

export function Search() {
    const [searchParams] = useSearchParams();
    const [searchResults, setSearchResults] = useState<Event[]>([]);
    const [serachTerm, setSearchTerm] = useState('')
    const [visibleCount, setVisibleCount] = useState(15);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [sortBy, setSortBy] = useState<string>()
    const [originalResults, setOriginalResults] = useState<Event[]>([]);
    const { events } = useAppSelector(state => state.eventModule)
    const navigate = useNavigate();
    const query = searchParams.get('q');
    const observer = useRef<IntersectionObserver | null>(null);
    const dispatch = useAppDispatch()
    const searchRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    useClickOutside(searchRef, () => setIsSearchOpen(false), null);


    useEffect(() => {
        if (!query || query === '') {
            const filter = eventService.getDefaultFilter()
            dispatch(loadEvents({ filterBy: filter, categorie: '', page: 0 }))
            setVisibleCount(15);
            setSearchTerm('');
            return
        };

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
    }, [query, dispatch]);

    useEffect(() => {
        // רק אם אין שאילתת חיפוש, אנחנו רוצים להשתמש בתוצאות הכלליות מה-Redux
        if (!query || query === '') {
            setSearchResults(events);
            setOriginalResults(events);
        }
    }, [events]);

    useEffect(() => {
        const sortFromUrl = searchParams.get('sort');
        if (sortFromUrl) {
            setSortBy(sortFromUrl);
        } else {
            setSortBy(''); // ברירת מחדל אם אין ב-URL
            setSearchResults(originalResults); // החזרת התוצאות למצב המקורי
        }
    }, [searchParams]);

    useEffect(() => {

        if (sortBy === "Volume") {
            setSearchResults(prev => [...prev].sort((a, b) => b.volume - a.volume));
        } else if (sortBy === "Newest") {
            setSearchResults(prev => [...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } else if (sortBy === "Trending") {
            setSearchResults(prev => [...prev].sort((a, b) => b.volume / ((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)) - a.volume / ((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60))));
        }
    }, [sortBy])


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

        if (sortBy === text) {
            newParams.delete('sort');
        } else {
            newParams.set('sort', text);
        }

        navigate(`/search?${newParams.toString()}`);
    }

    function onBrowse(ev: React.MouseEvent, sortBy?: string) {
        ev.stopPropagation()
        setIsSearchOpen(false)
        navigate(`/search?q=&sort=${sortBy}`)
    }

    function onTopicClicked(ev: React.MouseEvent) {
        ev.stopPropagation()
        const topic = (ev.target as HTMLDivElement).innerText
        setIsSearchOpen(false)
        navigate(`/${topic}`)
    }


    return (
        <section className="search-page">
            <div className="search-results">
                <div className="search-container narrow-screen" ref={searchRef} onClick={() => setIsSearchOpen(true)}>
                    <form onSubmit={(ev) => {
                        ev.preventDefault()
                        onSearch()
                    }}>
                        <input type="text" placeholder="Search" value={serachTerm} onChange={(ev) => hadnleSearchInput(ev.target.value)} className={`${isSearchOpen ? 'open' : ''}`} />
                        <SearchIcon className="icon search medium" />
                        <div className={`search-modal ${isSearchOpen ? 'open' : ''}`}>
                            <header>Browse</header>
                            <div className="browse-container">
                                <div className="browse-item" onClick={(ev) => onBrowse(ev, 'Newest')}><New /> New</div>
                                <div className="browse-item" onClick={(ev) => onBrowse(ev, 'Trending')}><Trending /> Trending</div>
                                <div className="browse-item" onClick={(ev) => onBrowse(ev, 'Volume')} ><Popular /> Popular</div>
                            </div>
                            <header>Topics</header>
                            <div className="topics-container">
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Politics</div>
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)} >Sports</div>
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Crypto</div>
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Finance</div>
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Climate</div>
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Tech</div>
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Economy</div>
                                <div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Culture</div>
                            </div>
                        </div>
                    </form>
                </div>
                <h3 className="header">
                    {query ? (
                        <>Search results for: <span>{query}</span></>
                    ) : (
                        "Explore Positarget"
                    )}
                </h3>
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
                    <div className={`sort-item flex ${sortBy === 'Trending' ? "active" : ''}`} onClick={onSortBy}><Trending />Trending</div>
                    <div className={`sort-item flex ${sortBy === 'Newest' ? "active" : ''}`} onClick={onSortBy}><New />Newest</div>
                    <div className={`sort-item flex ${sortBy === 'Volume' ? "active" : ''}`} onClick={onSortBy}><Popular />Volume</div>
                </div>
            </div>
        </section>
    );
}