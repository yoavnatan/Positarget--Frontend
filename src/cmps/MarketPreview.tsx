import { Link } from 'react-router-dom'
import { Market } from '../types/market'
import PieChartWithPaddingAngle from './pieChart'
import { useUniqueId } from 'recharts/types/util/useUniqueId'
import { nanoid } from 'nanoid'

export function MarketPreview({ market, img }: { market: Market, img: string }) {
    return <article className="market-preview">
        <header>
            <div className="market-info flex">
                <img src={market.imgUrl} alt={market.title} />
                <Link to={`/market/${market._id}`} className="market-title">{market.title}</Link>
                {!Array.isArray(market.options) && <div className="odds">
                    <div className="pie"><PieChartWithPaddingAngle yes={market.options.Yes} no={market.options.No} /></div>
                    <div className="odds-info">
                        <span className="number">{market.options.Yes}%</span>
                        <span className="text">chance</span>
                    </div>
                </div>}
            </div>
        </header>
        <main className="options">

            {Array.isArray(market.options) && market.type === 'binary' && market.options.map((option, index) => (
                <div key={`${market._id}-${index}`} className="option">
                    <button className="action-btn sport">{option.subtitle}</button>
                </div>
            ))}

            {/* {!Array.isArray(market.options) && market.type === 'binary' && market.options.map((option, index) => (
                <div key={`${market._id}-${index}`} className="option">
                    <button className="action-btn">{option.subtitle}</button>
                </div>
            ))} */}
        </main>
        <footer></footer>
    </article>
}


