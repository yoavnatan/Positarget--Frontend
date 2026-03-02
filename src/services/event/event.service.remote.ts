import { Event } from '../../types/event'
import { httpService } from '../http.service'

export const eventService = {
    query,
    getById,
    save,
    remove,
    addEventMsg
}

async function query(filterBy = { txt: '' }) {
    return httpService.get(`event`, filterBy)
}

function getById(eventId: string) {
    return httpService.get(`event/${eventId}`)
}

async function remove(eventId: string) {
    return httpService.delete(`event/${eventId}`)
}
async function save(event: Event) {
    var savedEvent
    if (event._id) {
        savedEvent = await httpService.put(`event/${event._id}`, event)
    } else {
        savedEvent = await httpService.post('event', event)
    }
    return savedEvent
}

async function addEventMsg(eventId: string, txt: string) {
    const savedMsg = await httpService.post(`event/${eventId}/msg`, { txt })
    return savedMsg
}