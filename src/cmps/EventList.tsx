import { polyImgs } from '../services/imgs'
import { userService } from '../services/user'
import { getRandomIntInclusive } from '../services/util.service'
import { Event } from '../types/event'
import { EventPreview } from './EventPreview'

interface EventListProps {
    events: Event[]
    onRemoveEvent: (eventId: string) => void
    onUpdateEvent: (event: Event) => void
}

export function EventList({ events, onRemoveEvent, onUpdateEvent }: EventListProps) {

    function shouldShowActionBtns(event: Event) {
        const user = userService.getLoggedinUser()

        if (!user) return false
        if (user.isAdmin) return true
    }

    return <section>
        <ul className="event-list">
            {events.map((event: Event) =>
                <li key={event._id}>
                    <EventPreview event={event} img={polyImgs[getRandomIntInclusive(0, polyImgs.length - 1)]} />
                    {shouldShowActionBtns(event) && <div className="actions">
                        <button onClick={() => onUpdateEvent(event)}>Edit</button>
                        <button onClick={() => onRemoveEvent(event._id)}>x</button>
                    </div>}
                </li>)
            }
        </ul>
    </section>
}