import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../store/store'
import { RootState } from '../store/store'
import { setMsg } from '../store/slices/system.slice'
import { loadEvent } from '../store/slices/event.slice'
import { eventService } from '../services/event'
import { Market } from '../types/event'
import { PriceChart } from '../cmps/PriceChart'


export function EventDetails() {
  const dispatch = useAppDispatch()
  const { eventId } = useParams()
  const { event } = useAppSelector((state) => state.eventModule)
  const [activeMarket, setActiveMarket] = useState<Market | null>(null)
  const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);

  useEffect(() => {
    if (activeMarket && activeMarket.clobTokenIds) {
      // שליחת הטוקן הראשון מהמערך
      const tokenId = activeMarket.clobTokenIds[0];

      eventService.fetchMarketPriceHistory(tokenId)
        .then(data => {
          setChartData(data);
        });
    }
  }, [activeMarket]);

  useEffect(() => {
    if (eventId) dispatch(loadEvent(eventId))
  }, [eventId])

  useEffect(() => {
    if (event && event.markets.length > 0) {
      setActiveMarket(event.markets[0])
    }
  }, [event])

  async function onAddEventMsg(eventId: string) {
    try {
      await eventService.addEventMsg(eventId, 'bla bla ' + parseInt((Math.random() * 10).toString()))
      dispatch(setMsg({ txt: 'Event msg added', type: 'success' }))
    } catch (err) {
      dispatch(setMsg({ txt: 'Cannot add event msg', type: 'error' }))
    }

  }

  const getUniqueName = (market: Market, allMarkets: Market[]): string | undefined => {
    const questions = allMarkets.map(m => m.question || "")
    if (questions.length <= 1) return market.outcomes[0]
    if (event) {
      const titleWords = event.title.toLowerCase().split(' ')
      const wordArrays = questions.map(q => q.toLowerCase().replace(/\?|,/g, '').split(' '))
      const commonWords = wordArrays[0].filter((word: string) => {
        const count = wordArrays.filter(arr => arr.includes(word)).length
        return count > wordArrays.length / 2 || titleWords.includes(word)
      })
      const blacklist = ['will', 'be', 'win', 'won', 'the', 'a', 'an', 'is', 'to', 'of', 'in', 'at', 'by', 'on', 'for', 'with', 'and', 'or', 'but', 'next', 'as', 'who', 'price', 'above']
      const unique = market.question.split(' ').filter((word: string) => {
        const cleanWord = word.toLowerCase().replace(/\?|,/g, '')
        return !commonWords.includes(cleanWord) && !blacklist.includes(cleanWord)
      }).join(' ').replace(/\?/g, '').trim()
      return unique || market.outcomes[0]
    }
  }

  console.log(event)
  return (
    <section className="event-details">
      {/* <Link to="/event">Back to list</Link> */}
      {event &&
        <header>
          <div className="event-info flex">
            <img src={event.imgUrl} alt={event.title} />
            <div className="inner-info">
              <div className="event-labels">
                {event.labels.slice(0, 2).map(label => (
                  <span key={label} className="event-label">{label}</span>
                ))}
              </div>
              <div className="event-title">
                <Link to={`/event/${event._id}`}>{event.title}</Link>
              </div>
            </div>
          </div>
          {/* <pre> {JSON.stringify(event, null, 2)} </pre> */}
        </header>
      }
      <main>
        <div className="options flex">
          {event && event?.markets.map((market => (
            <div key={market.id} className={`market ${activeMarket?.id === market.id ? 'active' : ''}`} onClick={() => setActiveMarket(market)}>

              <div className="option-name">{getUniqueName(market, event.markets)}</div>
            </div>
          )))}
        </div>
        <div className="market-details">
          {activeMarket && (
            <>
              {/* <pre>{JSON.stringify(activeMarket, null, 2)}</pre> */}
            </>)}
        </div>
        <div className="chart-container">
          {chartData.length > 0 ? (
            <PriceChart data={chartData} />
          ) : (
            <div className="loader-placeholder">
              <p>Analyzing market history...</p>
            </div>
          )}
        </div>
      </main>
      {/* {event && <button onClick={() => { onAddEventMsg(event._id) }}>Add event msg</button>} */}

    </section>
  )
}

