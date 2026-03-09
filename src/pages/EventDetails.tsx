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
import { time } from 'console'
import { EventComment } from '../types/event'
import { getAvatarStyle, timeAgo } from '../services/util.service'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon } from '@radix-ui/react-icons'

export function EventDetails() {
  const dispatch = useAppDispatch()
  const { eventId } = useParams()
  const { event } = useAppSelector((state) => state.eventModule)
  const [activeMarket, setActiveMarket] = useState<Market | null>(null)
  const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);
  const [timeframe, setTimeframe] = useState('all')
  const [comments, setComments] = useState<EventComment[] | []>([])
  const [tradingMethod, setTradingMethod] = useState<'market' | 'limit'>('market')
  const [selectedOutcome, setSelectedOutcome] = useState<string>('yes')

  useEffect(() => {
    if (activeMarket && activeMarket.clobTokenIds) {
      // שליחת הטוקן הראשון מהמערך
      const tokenId = activeMarket.clobTokenIds[0];

      eventService.fetchMarketPriceHistory(tokenId, timeframe)
        .then(data => {
          setChartData(data);
        });
    }
  }, [activeMarket, timeframe]);

  useEffect(() => {
    if (eventId) dispatch(loadEvent(eventId))
  }, [eventId])

  useEffect(() => {
    if (event && event.markets.length > 0) {
      setActiveMarket(event.markets[0])
      loadComments()
    }
  }, [event])

  async function loadComments() {
    if (!event) return
    try {
      const comments = await eventService.getComments(event._id)
      setComments(comments)
    } catch (err) {
      dispatch(setMsg({ txt: 'Cannot load comments', type: 'error' }))
    }
  }

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
  console.log(comments)
  return (
    <div className="event-details-page flex">
      <section className="event-details container">
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

            <PriceChart data={chartData} />

            <div className="controls">
              <h4>$ {event?.volume.toLocaleString()} Vol.</h4>
              <div className="buttons flex">
                <h4 className={`${timeframe === '1h' ? "active" : ""}`} onClick={() => setTimeframe('1h')}>1H</h4>
                <h4 className={`${timeframe === '6h' ? "active" : ""}`} onClick={() => setTimeframe('6h')}>6H</h4>
                <h4 className={`${timeframe === '1d' ? "active" : ""}`} onClick={() => setTimeframe('1d')}>1D</h4>
                <h4 className={`${timeframe === '1w' ? "active" : ""}`} onClick={() => setTimeframe('1w')}>1W</h4>
                <h4 className={`${timeframe === 'all' ? "active" : ""}`} onClick={() => setTimeframe('all')}>MAX</h4>
              </div>
            </div>
          </div>

          <div className="comments-section">
            <h3>Comments ({comments.length})</h3>

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((comment: any) => {
                  // חילוץ המזהה הייחודי לאוואטר
                  const avatarId = comment.proxy_wallet || comment.id || 'guest'

                  return (
                    <div key={comment.id} className="comment-card flex">
                      <div
                        className="user-avatar"
                        style={getAvatarStyle(avatarId)}
                      >
                      </div>

                      <div className="comment-content">
                        <div className="comment-header flex">
                          <span className="user-name">{comment.profile.name}</span>
                          <span className="comment-date">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="comment-text">{comment.body}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="no-comments">No comments yet. Be the first to react!</p>
              )}
            </div>
          </div>
        </main>
        {/* {event && <button onClick={() => { onAddEventMsg(event._id) }}>Add event msg</button>} */}

      </section>

      <section className="trading-section container">
        <header className="trading-header flex justify-between align-center">
          <div className="trading-rules flex">
            <div className="trading-rule">Buy</div>
            <div className="trading-rule">Sell</div>
          </div>
          <div className="trading-method">
            <Select.Root
              value={tradingMethod}
              onValueChange={(val) => setTradingMethod(val as 'market' | 'limit')}
            >
              <Select.Trigger className="trading-select radix-trigger">

                <Select.Value />
                <Select.Icon className="radix-icon">
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="radix-content" position="popper" sideOffset={5}>
                  <Select.Viewport>
                    <Select.Item value="limit" className="radix-item">
                      <Select.ItemText>Limit</Select.ItemText>
                    </Select.Item>
                    <Select.Item value="market" className="radix-item">
                      <Select.ItemText>Market</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </header>

        <main>
          <div className="trading-buttons flex">
            <button className={`trading-button yes ${selectedOutcome === 'yes' ? "active" : ""}`} onClick={() => setSelectedOutcome('yes')}>{activeMarket?.outcomes[0]} {activeMarket?.outcomePrices[0]}¢</button>
            <button className={`trading-button no ${selectedOutcome === 'no' ? "active" : ""}`} onClick={() => setSelectedOutcome('no')}>{activeMarket?.outcomes[1]} {activeMarket?.outcomePrices[1]}¢</button>
          </div>
        </main>
      </section>
    </div>
  )
}

