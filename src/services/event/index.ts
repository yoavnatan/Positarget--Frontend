const { DEV, VITE_LOCAL } = import.meta.env

declare global {
    interface Window {
        eventService: typeof eventService;
    }
}

import { FilterBy, Event } from '../../types/event';
import { getRandomIntInclusive, makeId } from '../util.service'

import { eventService as local } from './event.service.local'
import { eventService as remote } from './event.service.remote'

function getEmptyEvent(): Event {
    return {
        _id: '',
        title: makeId(),
        description: '',
        status: 'open',
        endDate: Date.now() + getRandomIntInclusive(1, 7) * 24 * 60 * 60 * 1000, // 1-7 days from now
        markets: [],
        category: '',
        volume: 0,
        imgUrl: '',
        msgs: [],
        labels: [],
        createdAt: Date.now(),
    }
}


function getDefaultFilter(): FilterBy {
    return {
        txt: '',
        labels: [],
        favoritesOnly: false,
        sortField: 'Trending',
        sortDir: 1,
    }
}

const service = (VITE_LOCAL === 'true') ? local : remote

// const service = local
export const eventService = { getEmptyEvent, getDefaultFilter, ...service }

// Easy access to this service from the dev tools console
// when using script - dev / dev:local

if (DEV) window.eventService = eventService
