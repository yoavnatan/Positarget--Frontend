import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../store/store'
import { RootState } from '../store/store'
import { setMsg } from '../store/slices/system.slice'
import { loadEvent } from '../store/slices/event.slice'
import { eventService } from '../services/event'


export function EventDetails() {
  const dispatch = useAppDispatch()
  const { eventId } = useParams()
  const { event } = useAppSelector((state) => state.eventModule)
  useEffect(() => {
    if (eventId) dispatch(loadEvent(eventId))
  }, [eventId])

  async function onAddEventMsg(eventId: string) {
    try {
      await eventService.addEventMsg(eventId, 'bla bla ' + parseInt((Math.random() * 10).toString()))
      dispatch(setMsg({ txt: 'Event msg added', type: 'success' }))
    } catch (err) {
      dispatch(setMsg({ txt: 'Cannot add event msg', type: 'error' }))
    }

  }

  return (
    <section className="event-details">
      <Link to="/event">Back to list</Link>
      <h1>Event Details</h1>
      {event && <div>
        <h3>{event.title}</h3>
        <pre> {JSON.stringify(event, null, 2)} </pre>
      </div>
      }
      {event && <button onClick={() => { onAddEventMsg(event._id) }}>Add event msg</button>}

    </section>
  )
}

