import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Money from '../assets/svg/money.svg?react'

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
import { setSelectedMarketId, setSelectedOutcome } from '../store/slices/user.slice'
import { current } from '@reduxjs/toolkit'
import { OrderBook } from '../cmps/OrderBook'

export function EventDetails() {
  const dispatch = useAppDispatch()
  const { eventId } = useParams()
  const { event } = useAppSelector((state) => state.eventModule)
  const { user, selectedMarketId } = useAppSelector((state: RootState) => state.userModule)
  const { selectedOutcome } = useAppSelector((state: RootState) => state.userModule)
  const [activeMarket, setActiveMarket] = useState<Market | null>(null)
  const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);
  const [timeframe, setTimeframe] = useState('all')
  const [comments, setComments] = useState<EventComment[] | []>([])
  const [tradingMethod, setTradingMethod] = useState<'market' | 'limit'>('market')
  const [tradingDirection, setTradingDirection] = useState<'buy' | 'sell'>('buy')
  const [orderAmount, setOrderAmount] = useState<string>('')
  const [limitPrice, setLimitPrice] = useState<string>('')
  const [shares, setShares] = useState<number | ''>()
  let isSport = [activeMarket?.outcomes[0]?.toLowerCase(), activeMarket?.outcomes[1]?.toLowerCase()].every(outcome => !['yes', 'no', 'up', 'down'].includes(outcome || ''))
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

    return () => {
      dispatch(setSelectedOutcome(''))
      dispatch(setSelectedMarketId(null))
    }
  }, [])

  useEffect(() => {
    if (eventId) dispatch(loadEvent(eventId))
    // dispatch(setSelectedOutcome('Yes'))
  }, [eventId])

  useEffect(() => {
    if (event && event.markets.length > 0) {
      if (!selectedMarketId) setActiveMarket(event.markets[0])
      else setActiveMarket(event.markets.find(m => m.id === selectedMarketId) || event.markets[0])
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '')

    // 1. מניעת יותר מנקודה אחת
    const parts = val.split('.')
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')

    // 2. הגבלה ל-2 ספרות אחרי הנקודה (רק אם יש נקודה)
    if (parts.length > 1 && parts[1].length > 2) {
      val = `${parts[0]}.${parts[1].slice(0, 2)}`
    }

    if (tradingMethod === 'market') {
      setOrderAmount(val)
    } else {
      // 3. הגנה על מחיר מקסימלי (למשל 100 סנט)
      if (+val > 100) return
      setLimitPrice(val)
    }
  }

  function handleLimit(change: number) {
    let currentPrice = parseFloat(limitPrice) || 0
    currentPrice += (0.1 * change)

    currentPrice = Math.round(currentPrice * 10) / 10
    if (currentPrice < 0) currentPrice = 0
    if (currentPrice > 100) currentPrice = 100
    setLimitPrice(currentPrice.toString())
  }

  let selectedOutcomeIndex = selectedOutcome === 'Yes' ? 0 : selectedOutcome === 'No' ? 1 : null;
  if (selectedOutcomeIndex === null) {
    selectedOutcomeIndex = activeMarket?.outcomes.findIndex(outcome => outcome.toLowerCase() === selectedOutcome.toLowerCase()) ?? null;

  }
  const price = selectedOutcomeIndex !== null && activeMarket?.outcomePrices[selectedOutcomeIndex]
    ? activeMarket.outcomePrices[selectedOutcomeIndex] / 100
    : 0;
  const toWin = price > 0 ? (+orderAmount / price).toFixed(2) : '0';

  console.log(activeMarket)
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

          {activeMarket && <OrderBook {...activeMarket} />}
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
          <div className="trading-dirs flex">
            <div className={`trading-dir ${tradingDirection === 'buy' ? "active" : ""}`} onClick={() => setTradingDirection('buy')}>Buy</div>
            <div className={`trading-dir ${tradingDirection === 'sell' ? "active" : ""}`} onClick={() => setTradingDirection('sell')}>Sell</div>
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
            <button className={`trading-button yes ${selectedOutcomeIndex === 0 ? "active" : ""} ${isSport ? "sport" : ""} `} onClick={() => dispatch(setSelectedOutcome('Yes'))}>{activeMarket?.outcomes[0]} <span>{activeMarket?.outcomePrices[0]}¢</span></button>
            <button className={`trading-button no ${selectedOutcomeIndex === 1 ? "active" : ""} ${isSport ? "sport" : ""}`} onClick={() => dispatch(setSelectedOutcome('No'))}>{activeMarket?.outcomes[1]} <span>{activeMarket?.outcomePrices[1]}¢</span></button>
          </div>
          {tradingMethod === 'market' ? (
            <>
              {tradingDirection === 'buy'
                ? (
                  <div className="market-order flex">
                    <div className="order-info">
                      <h4>Amount</h4>
                      <h6>Balance ${user?.cash?.toFixed(2)}</h6>
                    </div>
                    <input
                      type="text"
                      placeholder="$0"
                      value={orderAmount ? `$${orderAmount}` : ''}
                      onChange={handleInputChange}
                      className="order-input"
                    />
                  </div>)
                : (
                  <div className="market-order flex">
                    <div className="order-info">
                      <h4>Shares</h4>
                    </div>
                    <input
                      type="text"
                      placeholder="0"
                      value={orderAmount ? `${orderAmount}` : ''}
                      onChange={handleInputChange}
                      className="order-input"
                    />
                  </div>
                )}
              {<div className="money-btns flex">
                <button className="money-btn" onClick={() => setOrderAmount(prev => (parseFloat(prev) + 1).toString())}>+$1</button>
                <button className="money-btn" onClick={() => setOrderAmount(prev => (parseFloat(prev) + 5).toString())}>+$5</button>
                <button className="money-btn" onClick={() => setOrderAmount(prev => (parseFloat(prev) + 10).toString())}>+$10</button>
                <button className="money-btn" onClick={() => setOrderAmount(prev => (parseFloat(prev) + 100).toString())}>+$100</button>
                <button className="money-btn" onClick={() => setOrderAmount(user?.cash ? user.cash.toFixed(2) : '0')}>Max</button>
              </div>}
            </>

          ) : (
            <>
              <div className="limit-order flex">
                <h4>Limit Price</h4>
                <div className="limit-input container flex">
                  <div className="limit-btn" onClick={() => handleLimit(-1)}>-</div>
                  <input type="text" placeholder="0.0¢" value={limitPrice ? `${limitPrice}¢` : ''} onChange={handleInputChange} />
                  <div className="limit-btn" onClick={() => handleLimit(+1)}>+</div>
                </div>
              </div>

              <div className="shares flex">
                <h4>Shares</h4>
                <input
                  type="text"
                  placeholder="0"
                  value={shares}
                  onChange={(ev) => {
                    // מנקה כל מה שהוא לא מספר (0-9)
                    const val = ev.target.value.replace(/\D/g, '');
                    // הופך למספר רק אם יש ערך, אחרת משאיר מחרוזת ריקה (כדי שיהיה אפשר למחוק הכל)
                    setShares(val === '' ? '' : +val);
                  }}
                />
              </div>

              <div className="money-btns flex">
                <button className="money-btn" onClick={() => setShares(prev => (Number(prev) || 0) - 100)}>-100</button>
                <button className="money-btn" onClick={() => setShares(prev => (Number(prev) || 0) - 10)}>-10</button>
                <button className="money-btn" onClick={() => setShares(prev => (Number(prev) || 0) + 10)}>+10</button>
                <button className="money-btn" onClick={() => setShares(prev => (Number(prev) || 0) + 100)}>+100</button>
                <button className="money-btn gradient" onClick={() => setShares(prev => (Number(prev) || 0) + 200)}>+200</button>
              </div>
            </>
          )}
        </main>
        <footer>
          <div className={`order-summary flex ${(+orderAmount > 0) || tradingMethod === "limit" ? 'open' : ''} ${tradingDirection === 'sell' ? 'sell' : ''}`}>
            <div className="order-info">
              {tradingMethod === 'limit' && tradingDirection === 'buy' && <h2>Total</h2>}
              <h2>{`${tradingDirection === 'buy' ? 'To win' : `You'll receive`}`} {tradingMethod === 'market' && <Money className="money-icon" />}</h2>
              {tradingMethod === 'market' && <h6>Avg. Price</h6>}
            </div>
            {tradingMethod === 'market'
              ?
              (<div className="to-win">
                ${toWin}
              </div>)
              : (
                <div className="limit-summary">
                  {tradingDirection === 'buy' && <div className={`total`}>
                    ${limitPrice && shares ? ((+limitPrice / 100) * +shares).toFixed(2) : '0'}
                  </div>}
                  <div className="to-win">
                    <Money className="money-icon limit" /> ${tradingDirection === 'buy' ? shares || 0 : limitPrice && shares ? ((+limitPrice / 100) * +shares).toFixed(2) : '0'}
                  </div>
                </div>
              )

            }
          </div>
          {user?.cash === 0
            ?
            (<div className="signup-link">Deposit</div>)
            :
            (<div className="button-wrapper">
              <button className="place-order-btn">{`${user ? `${tradingDirection === 'buy' ? 'Buy' : 'Sell'}` : ''} ${user && selectedOutcomeIndex !== null ? activeMarket?.outcomes[selectedOutcomeIndex] : 'Trade'}`} </button>
            </div>)
          }

        </footer>
      </section>
    </div >
  )
}

