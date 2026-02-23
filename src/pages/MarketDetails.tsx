import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../store/store'
import { RootState } from '../store/store'
import { setMsg } from '../store/slices/system.slice'
import { loadMarket } from '../store/slices/market.slice'
import { marketService } from '../services/market'


export function MarketDetails() {
  const dispatch = useAppDispatch()
  const { marketId } = useParams()
  const { market } = useAppSelector((state) => state.marketModule)
  useEffect(() => {
    if (marketId) dispatch(loadMarket(marketId))
  }, [marketId])

  async function onAddMarketMsg(marketId: string) {
    try {
      await marketService.addMarketMsg(marketId, 'bla bla ' + parseInt((Math.random() * 10).toString()))
      dispatch(setMsg({ txt: 'Market msg added', type: 'success' }))
    } catch (err) {
      dispatch(setMsg({ txt: 'Cannot add market msg', type: 'error' }))
    }

  }

  return (
    <section className="market-details">
      <Link to="/market">Back to list</Link>
      <h1>Market Details</h1>
      {market && <div>
        <h3>{market.title}</h3>
        <pre> {JSON.stringify(market, null, 2)} </pre>
      </div>
      }
      {market && <button onClick={() => { onAddMarketMsg(market._id) }}>Add market msg</button>}

    </section>
  )
}

