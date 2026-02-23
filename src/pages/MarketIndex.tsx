import { useState, useEffect } from 'react'
import { marketService } from '../services/market'
import { userService } from '../services/user'
import { MarketList } from '../cmps/MarketList'
import { MarketFilter } from '../cmps/MarketFilter'
import { useAppDispatch, useAppSelector } from '../store/store'
import { FilterBy, Market } from '../types/market'
import { setMsg } from '../store/slices/system.slice'
import { addMarket, loadMarkets, removeMarket, updateMarket } from '../store/slices/market.slice'

export function MarketIndex() {
    const dispatch = useAppDispatch()
    const [filterBy, setFilterBy] = useState<FilterBy>(marketService.getDefaultFilter())
    const { markets } = useAppSelector(state => state.marketModule)

    useEffect(() => {
        dispatch(loadMarkets(filterBy))
    }, [filterBy])

    async function onRemoveMarket(marketId: string) {
        try {
            await dispatch(removeMarket(marketId))
            dispatch(setMsg({ txt: 'Market removed', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Faild to remove market', type: 'error' }))
        }
    }

    async function onAddMarket() {
        const market = marketService.getEmptyMarket()
        market.title = prompt('Vendor?', 'Some Vendor') || market.title
        try {
            dispatch(addMarket(market))
            dispatch(setMsg({ txt: 'Market Added', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Cannot add market', type: 'error' }))
        }
    }

    async function onUpdateMarket(market: Market) {
        const marketToSave = { ...market }
        try {
            dispatch(updateMarket(marketToSave))
            dispatch(setMsg({ txt: 'Market updated', type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Cannot update market', type: 'error' }))
        }
    }

    return (
        <section className="market-index">
            <header>
                <h2>Markets</h2>
                {userService.getLoggedinUser() && <button onClick={onAddMarket}>Add a Market</button>}
            </header>
            <MarketFilter filterBy={filterBy} setFilterBy={setFilterBy} />
            <MarketList
                markets={markets}
                onRemoveMarket={onRemoveMarket}
                onUpdateMarket={onUpdateMarket} />
        </section>
    )
}