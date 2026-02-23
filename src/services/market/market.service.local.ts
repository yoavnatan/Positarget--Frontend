
declare global {
    interface Window {
        cs: typeof marketService;
    }
}

import { storageService } from '../async-storage.service'
import { makeId } from '../util.service'
import { userService } from '../user'
import { FilterBy, Market } from '../../types/market';

const STORAGE_KEY = 'market'

export const marketService = {
    query,
    getById,
    save,
    remove,
    addMarketMsg
}
window.cs = marketService


async function query(filterBy: FilterBy) {
    var markets: Market[] = await storageService.query(STORAGE_KEY)
    const { txt, sortField, sortDir } = filterBy

    if (txt) {
        const regex = new RegExp(filterBy.txt, 'i')
        markets = markets.filter(market => regex.test(market.title) || regex.test(market.description))
    }
    // if (minSpeed) {
    //     markets = markets.filter(market => market.speed >= minSpeed)
    // }
    // if (sortField === 'vendor') {
    //     markets.sort((market1, market2) =>
    //         market1[sortField].localeCompare(market2[sortField]) * +sortDir)
    // }
    // if (sortField === 'speed') {
    //     markets.sort((market1, market2) =>
    //         (market1[sortField] - market2[sortField]) * +sortDir)
    // }

    return markets
}

function getById(marketId: string): Promise<Market> {
    return storageService.get(STORAGE_KEY, marketId)
}

async function remove(marketId: string) {
    // throw new Error('Nope')
    await storageService.remove(STORAGE_KEY, marketId)
}

function save(market: Market) {
    if (market._id) {
        return storageService.put(STORAGE_KEY, market)
    } else {
        return storageService.post(STORAGE_KEY, market)
    }
}

async function addMarketMsg(marketId: string, txt: string) {
    // Later, this is all done by the backend
    const market = await getById(marketId)

    const msg = {
        id: makeId(),
        by: userService.getLoggedinUser(),
        txt
    }
    market.msgs.push(msg)
    await storageService.put(STORAGE_KEY, market)

    return msg
}