import { Market } from '../../types/market'
import { httpService } from '../http.service'

export const marketService = {
    query,
    getById,
    save,
    remove,
    addMarketMsg
}

async function query(filterBy = { txt: '' }) {
    return httpService.get(`market`, filterBy)
}

function getById(marketId: string) {
    return httpService.get(`market/${marketId}`)
}

async function remove(marketId: string) {
    return httpService.delete(`market/${marketId}`)
}
async function save(market: Market) {
    var savedMarket
    if (market._id) {
        savedMarket = await httpService.put(`market/${market._id}`, market)
    } else {
        savedMarket = await httpService.post('market', market)
    }
    return savedMarket
}

async function addMarketMsg(marketId: string, txt: string) {
    const savedMsg = await httpService.post(`market/${marketId}/msg`, { txt })
    return savedMsg
}