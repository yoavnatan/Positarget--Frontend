const { DEV, VITE_LOCAL } = import.meta.env

declare global {
    interface Window {
        marketService: typeof marketService;
    }
}

import { FilterBy, Market } from '../../types/market';
import { getRandomIntInclusive, makeId } from '../util.service'

import { marketService as local } from './market.service.local'
import { marketService as remote } from './market.service.remote'

function getEmptyMarket(): Market {
    return {
        _id: '',
        title: makeId(),
        description: '',
        status: 'open',
        endDate: Date.now() + getRandomIntInclusive(1, 7) * 24 * 60 * 60 * 1000, // 1-7 days from now
        yesShares: 0,
        noShares: 0,
        msgs: []
    }
}


function getDefaultFilter(): FilterBy {
    return {
        txt: '',
        sortField: '',
        sortDir: 1,
    }
}

const service = (VITE_LOCAL === 'true') ? local : remote
export const marketService = { getEmptyMarket, getDefaultFilter, ...service }

// Easy access to this service from the dev tools console
// when using script - dev / dev:local

if (DEV) window.marketService = marketService
