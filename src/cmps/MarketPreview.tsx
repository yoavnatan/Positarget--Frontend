import { Link } from 'react-router-dom'
import { Market } from '../types/market'

export function MarketPreview({ market }: { market: Market }) {
    return <article className="market-preview">
        <header>
            <Link to={`/market/${market._id}`}>{market.title}</Link>
        </header>
    </article>
}

