import { useState, useEffect } from 'react'
import { eventService } from '../services/event'
import { userService } from '../services/user'
import { EventList } from '../cmps/EventList'
import { EventFilter } from '../cmps/EventFilter'
import { useAppDispatch, useAppSelector } from '../store/store'
import { FilterBy, Event } from '../types/event'
import { setMsg } from '../store/slices/system.slice'
import { addEvent, loadEvents, removeEvent, updateEvent } from '../store/slices/event.slice'

export function EventIndex() {
    const dispatch = useAppDispatch()
    const [filterBy, setFilterBy] = useState<FilterBy>(eventService.getDefaultFilter())
    const { events } = useAppSelector(state => state.eventModule)

    useEffect(() => {
        dispatch(loadEvents(filterBy))
    }, [filterBy])

    async function onRemoveEvent(eventId: string) {
        try {
            await dispatch(removeEvent(eventId))
            dispatch(setMsg({ txt: 'Event removed', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Faild to remove event', type: 'error' }))
        }
    }

    async function onAddEvent() {
        const event = eventService.getEmptyEvent()
        event.title = prompt('Vendor?', 'Some Vendor') || event.title
        try {
            dispatch(addEvent(event))
            dispatch(setMsg({ txt: 'Event Added', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Cannot add event', type: 'error' }))
        }
    }

    async function onUpdateEvent(event: Event) {
        const eventToSave = { ...event }
        try {
            dispatch(updateEvent(eventToSave))
            dispatch(setMsg({ txt: 'Event updated', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Cannot update event', type: 'error' }))
        }
    }

    return (
        <section className="event-index">
            <header>
                {userService.getLoggedinUser() && <button onClick={onAddEvent}>Add a Event</button>}
            </header>
            {/* <EventFilter filterBy={filterBy} setFilterBy={setFilterBy} /> */}
            <EventList
                events={events}
                onRemoveEvent={onRemoveEvent}
                onUpdateEvent={onUpdateEvent} />
        </section>
    )
}