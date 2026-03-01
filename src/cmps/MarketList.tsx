import { polyImgs } from '../services/imgs'
import { userService } from '../services/user'
import { getRandomIntInclusive } from '../services/util.service'
import { Market } from '../types/market'
import { MarketPreview } from './MarketPreview'

interface MarketListProps {
    markets: Market[]
    onRemoveMarket: (marketId: string) => void
    onUpdateMarket: (market: Market) => void
}

export function MarketList({ markets, onRemoveMarket, onUpdateMarket }: MarketListProps) {

    function shouldShowActionBtns(market: Market) {
        const user = userService.getLoggedinUser()

        if (!user) return false
        if (user.isAdmin) return true
    }

    return <section>
        <ul className="market-list">
            {markets.map((market: Market) =>
                <li key={market._id}>
                    <MarketPreview market={market} img={polyImgs[getRandomIntInclusive(0, polyImgs.length - 1)]} />
                    {shouldShowActionBtns(market) && <div className="actions">
                        <button onClick={() => onUpdateMarket(market)}>Edit</button>
                        <button onClick={() => onRemoveMarket(market._id)}>x</button>
                    </div>}
                </li>)
            }
        </ul>
    </section>
}