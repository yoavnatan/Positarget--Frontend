import { useState, useEffect, useRef, useCallback } from 'react'
import { eventService } from '../services/event'
import { userService } from '../services/user'
import { EventList } from '../cmps/EventList'
import { EventFilter } from '../cmps/EventFilter'
import { useAppDispatch, useAppSelector } from '../store/store'
import { FilterBy, Event } from '../types/event'
import { setMsg } from '../store/slices/system.slice'
import { addEvent, loadEvents, removeEvent, updateEvent } from '../store/slices/event.slice'
import { useParams } from 'react-router'
import { Loader } from '../cmps/Loader'
import { TopLoader } from '../cmps/TopLoader'

export function EventIndex() {
    const dispatch = useAppDispatch()
    const [filterBy, setFilterBy] = useState<FilterBy>(eventService.getDefaultFilter())
    const [page, setPage] = useState(0);
    const [isAutoLoad, setIsAutoLoad] = useState(false)
    const [autoLoadCount, setAutoLoadCount] = useState(0)
    const { events, isLoading, hasMore } = useAppSelector(state => state.eventModule)
    const { categorie } = useParams() as { categorie: string }
    const { user } = useAppSelector(state => state.userModule)
    const [eventsToShow, setEventsToShow] = useState<Event[]>([])

    useEffect(() => {
        setIsAutoLoad(false)
        setPage(0)
        setAutoLoadCount(0)
        dispatch(loadEvents({ filterBy, categorie, page: 0 }))
        setFilterBy(eventService.getDefaultFilter())
    }, [categorie])

    useEffect(() => {

        let filteredEvents = events
        if (filterBy.txt !== '') {
            console.log(filterBy.txt)
            filteredEvents = events.filter(ev => ev.title.toLowerCase().includes(filterBy.txt.toLowerCase()))
            console.log(filteredEvents)
        }
        if (filterBy.labels.length > 0) {
            filteredEvents = filteredEvents.filter(ev => filterBy.labels.some(label => ev.labels.includes(label)))
        }
        if (filterBy.favoritesOnly) {
            filteredEvents = filteredEvents.filter(ev => user?.favoriteEvents?.includes(ev._id))
        }
        setEventsToShow(filteredEvents)

    }, [filterBy, events])

    async function onRemoveEvent(eventId: string) {
        try {
            await dispatch(removeEvent(eventId))
            dispatch(setMsg({ txt: 'Event removed', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Faild to remove event', type: 'error' }))
        }
    }

    function onLoadMore() {
        setIsAutoLoad(true)
        const nextPage = page + 1
        setPage(nextPage)
        dispatch(loadEvents({ filterBy, categorie, page: nextPage }))
    }

    // async function onAddEvent() {
    //     const event = eventService.getEmptyEvent()
    //     event.title = prompt('Vendor?', 'Some Vendor') || event.title
    //     try {
    //         dispatch(addEvent(event))
    //         dispatch(setMsg({ txt: 'Event Added', type: 'success' }))
    //     } catch (err) {
    //         dispatch(setMsg({ txt: 'Cannot add event', type: 'error' }))
    //     }
    // }

    async function onUpdateEvent(event: Event) {
        const eventToSave = { ...event }
        try {
            dispatch(updateEvent(eventToSave))
            dispatch(setMsg({ txt: 'Event updated', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Cannot update event', type: 'error' }))
        }
    }
    const observer = useRef<IntersectionObserver | null>(null)

    // פונקציה שמזהה את האלמנט האחרון ברשימה
    const lastEventElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading || !isAutoLoad || !hasMore) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setAutoLoadCount(prevCount => {
                    if (prevCount < 2) {
                        setPage(prevPage => {
                            const nextPage = prevPage + 1
                            dispatch(loadEvents({ filterBy, categorie, page: nextPage }))
                            return nextPage
                        })
                        return prevCount + 1
                    } else {
                        setIsAutoLoad(false)
                        return 0
                    }
                })
            }
        })
        if (node) observer.current.observe(node)
    }, [isLoading, isAutoLoad, hasMore, dispatch, filterBy, categorie])

    return (
        <section className="event-index">
            {(isLoading && page === 0) && <TopLoader />}

            <header>
                {/* {userService.getLoggedinUser() && <button onClick={onAddEvent}>Add a Event</button>} */}
            </header>
            <EventFilter filterBy={filterBy} setFilterBy={setFilterBy} />
            <EventList
                events={eventsToShow}
                onRemoveEvent={onRemoveEvent}
                onUpdateEvent={onUpdateEvent} />
            <div className="pagination-container" style={{ textAlign: 'center', margin: '20px' }}>

                {!hasMore && events.length > 0 && (
                    <p className="end-of-results">No more markets to show</p>
                )}

                {hasMore && !isAutoLoad && !isLoading && !filterBy.favoritesOnly && (
                    <button className="btn-pagination" onClick={onLoadMore}>
                        Show more markets
                    </button>
                )}

                <div className="loader-fixed-height" style={{ height: '50px' }}>
                    {isLoading && page > 0 && <Loader />}
                </div>

                {hasMore && isAutoLoad && (
                    <div ref={lastEventElementRef} style={{ height: '20px' }}></div>
                )}
            </div>
        </section>

    )
}