import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Money from '../assets/svg/money.svg?react'
import DirArrow from '../assets/svg/dirarrow.svg?react'
import Delete from '../assets/svg/delete.svg?react'
import { useAppDispatch, useAppSelector } from '../store/store'
import { RootState } from '../store/store'
import { setIsAuthShown, setModalType, setMsg } from '../store/slices/system.slice'
import { loadEvent, setEvent } from '../store/slices/event.slice'
import { eventService } from '../services/event'
import { Market, Msg } from '../types/event'
import { PriceChart } from '../cmps/PriceChart'
import { time } from 'console'
import { EventComment } from '../types/event'
import { getAvatarStyle, timeAgo } from '../services/util.service'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { setSelectedMarketId, setSelectedOutcome, setTradingDirection, setTradingMethod, updateUser } from '../store/slices/user.slice'
import { OrderBook } from '../cmps/OrderBook'
import { LongTxt } from '../cmps/LongTxt'
import { confirmAlert } from 'react-confirm-alert';
import { userService } from '../services/user'
import { User } from '../types/user.type'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { NumberTicker } from '../cmps/NumberTicker'
import CountUp from 'react-countup'
import NumberFlow from '@number-flow/react'
// ── חדש ──────────────────────────────────────────────────────────────────────
import { subscribeToEventComments } from '../services/socket.service'
import { useMarketLiveData } from '../customHooks/useMarketLiveData'
// ─────────────────────────────────────────────────────────────────────────────


export function EventDetails() {
  const dispatch = useAppDispatch()
  const { eventId } = useParams()
  const { event } = useAppSelector((state) => state.eventModule)
  const { user, selectedMarketId, tradingDirection, tradingMethod } = useAppSelector((state: RootState) => state.userModule)
  const { selectedOutcome } = useAppSelector((state: RootState) => state.userModule)
  const [activeMarket, setActiveMarket] = useState<Market | null>(null)
  const [chartData, setChartData] = useState<{ time: number, value: number }[]>([]);
  const [timeframe, setTimeframe] = useState('all')
  const [comments, setComments] = useState<(EventComment | Msg)[] | []>([])
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [orderAmount, setOrderAmount] = useState<string>('')
  const [limitPrice, setLimitPrice] = useState<string>('')
  const [shares, setShares] = useState<number | ''>()
  let isSport = [activeMarket?.outcomes[0]?.toLowerCase(), activeMarket?.outcomes[1]?.toLowerCase()].every(outcome => !['yes', 'no', 'up', 'down'].includes(outcome || ''))
  const marketOrderRef = useRef<HTMLDivElement | null>(null)
  const limitOrderRef = useRef<HTMLDivElement | null>(null)
  const sharesOrderRef = useRef<HTMLDivElement | null>(null)
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [periodStartValue, setPeriodStartValue] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // ── חדש: נקודה אחרונה לגרף — ref כדי שלא יגרום לרינדור של EventDetails ──
  const [latestChartPoint, setLatestChartPoint] = useState<{ time: number; value: number } | null>(null)

  // ── חדש: מחירים חיים + עדכון גרף דרך סוקט ────────────────────────────────
  const { livePrices } = useMarketLiveData(
    activeMarket?.clobTokenIds ?? [],
    activeMarket?.outcomePrices ?? [],
    (newPoint) => {
      // מעדכן את הגרף וגם את המחיר המוצג מעל הגרף
      setLatestChartPoint(newPoint)
      setChartData(prev => [...prev, newPoint])
    }
  )
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeMarket && activeMarket.clobTokenIds) {
      const tokenId = activeMarket.clobTokenIds[0];

      eventService.fetchMarketPriceHistory(tokenId, timeframe)
        .then(data => {
          setChartData(data);
          if (data && data.length > 0) {
            setPeriodStartValue(data[0].value * 100);
          } else {
            setPeriodStartValue(null);
          }
        });
    }
  }, [activeMarket, timeframe]);

  useEffect(() => {
    return () => {
      dispatch(setSelectedOutcome(''))
      dispatch(setSelectedMarketId(null))
      dispatch(setTradingDirection('buy'))
      dispatch(setTradingMethod('market'))
    }
  }, [])

  useEffect(() => {
    if (eventId) dispatch(loadEvent(eventId))
    return () => { dispatch(setEvent(null)) }
  }, [eventId])

  // ── שינוי: פיצול ל-2 useEffects — market ו-comments בנפרד ───────────────
  useEffect(() => {
    if (!event || event.markets.length === 0) return
    if (!selectedMarketId) setActiveMarket(event.markets[0])
    else setActiveMarket(event.markets.find(m => m.id === selectedMarketId) || event.markets[0])
  }, [event])

  useEffect(() => {
    if (!event) return
    loadComments()
    // comments חיים מ-RTDS דרך הבקאנד
    const unsubscribe = subscribeToEventComments(event._id, (newComment) => {
      setComments(prev => [newComment, ...prev])
    })
    return unsubscribe
  }, [event?._id])
  // ─────────────────────────────────────────────────────────────────────────────

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
    const parts = val.split('.')
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
    if (parts.length > 1 && parts[1].length > 2) {
      val = `${parts[0]}.${parts[1].slice(0, 2)}`
    }
    if (tradingMethod === 'market') {
      setOrderAmount(val)
    } else {
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

  async function onDeleteMsg(msgId: string) {
    confirmAlert({
      title: 'Confirm to delete',
      closeOnClickOutside: true,
      closeOnEscape: true,
      customUI: ({ onClose }) => {
        return (
          <div className="delete-modal" style={{ padding: '1em', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'izmir-medium', marginBottom: '.5em' }}>Comment Deleting</h2>
            <p style={{ fontFamily: 'izmir-light' }}>Are you sure?</p>
            <div className="flex" style={{ marginTop: '.5em', justifyContent: 'center' }}>
              <button className="money-btn" onClick={onClose}>Cancel</button>
              <button
                className="place-order-btn"
                style={{ width: 'auto', margin: 0, backgroundColor: '#ff4d4d', border: '2px solid black', borderRadius: '2em', color: 'white', paddingInline: '1em' }}
                onClick={async () => {
                  try {
                    await eventService.deleteEventMsg(msgId)
                    setComments((comments) => comments.filter(c => {
                      if ('_id' in c) return c._id !== msgId;
                      return true;
                    }))
                    dispatch(setMsg({ txt: 'Comment deleted', type: 'success' }))
                  } catch (err) {
                    dispatch(setMsg({ txt: 'Cannot delete comment', type: 'error' }))
                  }
                  onClose();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )
      }
    });
  }

  function addAmount(amount: number) {
    setOrderAmount(prev => {
      const current = parseFloat(prev);
      const base = isNaN(current) ? 0 : current;
      return (base + amount).toString();
    });
  };

  function confirmOrder(title: string, message: string, onConfirm: () => Promise<void>) {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="transaction-modal" style={{ padding: '1em', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'izmir-medium', marginBottom: '.5em' }}>{title}</h2>
          <p style={{ fontFamily: 'izmir-light' }}>{message}</p>
          <div className="flex" style={{ marginTop: '.5em', justifyContent: 'center' }}>
            <button className="money-btn" onClick={onClose}>Cancel</button>
            <button
              className="place-order-btn"
              style={{ width: 'auto', margin: 0, backgroundColor: 'green', color: 'white', paddingInline: '1em', border: '2px solid black', borderRadius: '2em' }}
              onClick={async () => { await onConfirm(); onClose(); }}
            >
              Confirm
            </button>
          </div>
        </div>
      )
    });
  }

  function onPlaceOrder(outcomeIdx: number | null) {
    if (!user) return dispatch(setModalType('AUTH'))
    if (outcomeIdx === null || !activeMarket) return
    const priceInCents = activeMarket.outcomePrices[outcomeIdx]
    if (priceInCents === 0 || priceInCents === 100) {
      return dispatch(setMsg({ txt: 'Market is currently closed or resolved (0¢ / 100¢)', type: 'error' }))
    }
    if (tradingMethod === 'limit') {
      if (!limitPrice || +limitPrice <= 0) return triggerShakeEffect()
      if (!shares || +shares <= 0) return triggerShakeEffect()
      if (tradingDirection === 'buy' && (+limitPrice >= priceInCents)) {
        return dispatch(setMsg({ txt: 'The limit price must be below the current market price.', type: 'error' }))
      } else if (tradingDirection === 'sell' && (+limitPrice <= priceInCents / 100)) {
        return dispatch(setMsg({ txt: 'The limit price must be above the current market price.', type: 'error' }))
      }
      if (tradingDirection === 'buy') handleBuy(outcomeIdx)
      else handleSell(outcomeIdx)
    } else {
      if (!orderAmount || +orderAmount <= 0) return triggerShakeEffect()
      if (tradingDirection === 'buy') handleBuy(outcomeIdx)
      else handleSell(outcomeIdx)
    }
  }

  async function handleBuy(outcomeIdx: number) {
    const outcomeName = activeMarket!.outcomes[outcomeIdx]
    const marketPriceInCents = activeMarket!.outcomePrices[outcomeIdx]

    let totalCost: number
    let sharesToBuy: number
    let executionPrice: number

    if (tradingMethod === 'limit') {
      executionPrice = +limitPrice
      sharesToBuy = +(shares || 0)
      totalCost = (executionPrice / 100) * sharesToBuy
    } else {
      executionPrice = marketPriceInCents
      totalCost = +orderAmount
      sharesToBuy = totalCost / (executionPrice / 100)
    }

    if (!user?.cash || (totalCost > user.cash + 0.0001)) {
      return dispatch(setMsg({ txt: 'Insufficient balance', type: 'error' }))
    }

    const msg = `You are going to spend $${totalCost.toFixed(2)} to buy ${sharesToBuy.toFixed(2)} shares of ${outcomeName} at ${executionPrice}¢. Are you sure?`

    confirmOrder('Confirm Buy', msg, async () => {
      const existingPosIdx = user!.portfolio?.findIndex(
        p => p.marketId === activeMarket!.id && p.outcome === outcomeName && p.orderType === tradingMethod
      )
      let updatedPortfolio = [...(user!.portfolio || [])]
      if (existingPosIdx !== -1 && existingPosIdx !== undefined) {
        const existingPos = updatedPortfolio[existingPosIdx]
        const newTotalShares = existingPos.shares + sharesToBuy
        const totalInvestment = (existingPos.shares * existingPos.avgPrice) + (sharesToBuy * executionPrice)
        updatedPortfolio[existingPosIdx] = { ...existingPos, shares: newTotalShares, avgPrice: totalInvestment / newTotalShares }
      } else {
        updatedPortfolio.push({ eventId: eventId!, marketId: activeMarket!.id, outcome: outcomeName, shares: sharesToBuy, avgPrice: executionPrice, orderType: tradingMethod })
      }
      await saveUserUpdate({ ...user!, cash: user!.cash! - totalCost, portfolio: updatedPortfolio })
    })
  }

  async function handleSell(outcomeIdx: number) {
    const outcomeName = activeMarket!.outcomes[outcomeIdx]
    const marketPriceInCents = activeMarket!.outcomePrices[outcomeIdx]

    let sharesToSell: number
    let executionPrice: number

    if (tradingMethod === 'limit') {
      executionPrice = +limitPrice
      sharesToSell = +(shares || 0)
    } else {
      executionPrice = marketPriceInCents
      sharesToSell = +orderAmount
    }

    const position = user?.portfolio?.find(p =>
      p.marketId === activeMarket!.id && p.outcome === outcomeName && p.orderType === tradingMethod
    )

    if (!position || position.shares < sharesToSell) {
      const msgTxt = tradingMethod === 'limit' ? 'Not enough shares in your Limit positions' : 'Not enough shares in your Market positions'
      return dispatch(setMsg({ txt: msgTxt, type: 'error' }))
    }

    const revenue = (sharesToSell * executionPrice) / 100
    const msg = `You are selling ${sharesToSell} shares from your ${tradingMethod} position at ${executionPrice}¢ for $${revenue.toFixed(2)}. Are you sure?`

    confirmOrder('Confirm Sell', msg, async () => {
      const updatedShares = position.shares - sharesToSell
      const updatedUser = {
        ...user!,
        cash: (user!.cash || 0) + revenue,
        portfolio: updatedShares > 0
          ? user!.portfolio!.map(p =>
            p.marketId === activeMarket!.id && p.outcome === outcomeName && p.orderType === tradingMethod
              ? { ...p, shares: updatedShares } : p
          )
          : user!.portfolio!.filter(p =>
            !(p.marketId === activeMarket!.id && p.outcome === outcomeName && p.orderType === tradingMethod)
          )
      }
      await saveUserUpdate(updatedUser)
    })
  }

  async function saveUserUpdate(updatedUser: User) {
    try {
      await userService.update(updatedUser)
      dispatch(updateUser(updatedUser))
      dispatch(setMsg({ txt: 'Transaction succeeded', type: 'success' }))
      setOrderAmount('')
    } catch (err) {
      dispatch(setMsg({ txt: 'Cannot execute this transaction', type: 'error' }))
    }
  }

  function triggerShakeEffect() {
    const el = marketOrderRef.current
    const el1 = limitOrderRef.current
    const el2 = sharesOrderRef.current
    if (el) {
      el.classList.add('shake')
      setTimeout(() => el.classList.remove('shake'), 500)
    } else if (el1 && +limitPrice <= 0) {
      el1.classList.add('shake')
      setTimeout(() => el1.classList.remove('shake'), 500)
    } else if (el2 && (shares && shares <= 0 || shares === '')) {
      el2.classList.add('shake')
      setTimeout(() => el2.classList.remove('shake'), 500)
    }
  }

  function onDeposit() {
    dispatch(setModalType('DEPOSIT'))
  }

  let selectedOutcomeIndex = selectedOutcome === 'Yes' ? 0 : selectedOutcome === 'No' ? 1 : null;
  if (selectedOutcomeIndex === null) {
    selectedOutcomeIndex = activeMarket?.outcomes.findIndex(outcome => outcome.toLowerCase() === selectedOutcome.toLowerCase()) ?? null;
  }

  // ── חדש: price מחושב מ-livePrices ולא מ-activeMarket ────────────────────
  const price = selectedOutcomeIndex !== null && livePrices[selectedOutcomeIndex]
    ? livePrices[selectedOutcomeIndex] / 100
    : 0;
  // ─────────────────────────────────────────────────────────────────────────────

  let toWin
  if (tradingDirection === 'buy') toWin = price > 0 ? (+orderAmount / price).toFixed(2) : '0';
  else toWin = price > 0 ? (+orderAmount * price).toFixed(2) : '0';

  const getDisplayData = () => {
    if (!chartData || chartData.length === 0) {
      return { val: 0, change: null }
    }
    const sorted = [...chartData].sort((a, b) => a.time - b.time)
    const first = sorted[0].value * 100
    const last = sorted[sorted.length - 1].value * 100
    const current = hoveredValue ?? last
    const percentChange = first !== 0 ? ((current - first) / first) * 100 : 0
    return {
      val: current,
      change: {
        isPos: percentChange >= 0,
        text: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`
      }
    }
  }
  const display = getDisplayData();

  const { scrollY } = useScroll()
  const contentScale = useTransform(scrollY, [0, 100], [1, 0.8])
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1])

  return (
    <div className={`event-details-page flex ${isDrawerOpen ? 'drawer-open' : ''}`}>
      <section className="event-details container">
        {event &&
          <motion.header
            className="sticky-header"
            style={{ '--border-opacity': borderOpacity } as any}
          >
            <motion.div
              className="header-content-wrapper"
              style={{ scale: contentScale, transformOrigin: 'top left', width: '100%' }}
            >
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
            </motion.div>
          </motion.header>
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
            {activeMarket && (<></>)}
          </div>
          <div className="chart-container">
            <div className='current flex align-center' style={{ gap: '10px' }}>
              <div className="flex align-center">
                <NumberFlow
                  value={display.val}
                  format={{ maximumFractionDigits: 0 }}
                  continuous={false}
                  trend={true}
                  className="ticker-display"
                />
                <span style={{ marginLeft: '4px', fontWeight: '600' }}>% chance</span>
              </div>
              {display.change && (
                <div
                  className="flex align-center"
                  style={{ color: display.change.isPos ? '#00aa5d' : '#ff4d4d', fontWeight: '600', fontSize: '0.8rem' }}
                >
                  <span style={{ marginInlineEnd: '5px', translate: '0 1px' }}>
                    {display.change.isPos ? <DirArrow /> : <DirArrow style={{ rotate: '180deg' }} />}
                  </span>
                  <NumberFlow
                    value={parseFloat(display.change.text.replace(/[+%-]/g, ''))}
                    format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }}
                    suffix="%"
                    trend={true}
                  />
                </div>
              )}
            </div>

            {/* ── חדש: newPoint מועבר ל-PriceChart ── */}
            <PriceChart data={chartData} onHoverValue={setHoveredValue} newPoint={latestChartPoint} />

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
          {activeMarket && <div className='market-description'>
            <h3>Rules</h3>
            <LongTxt txt={activeMarket?.description} />
          </div>}
          <div className="comments-section">
            <h3>Comments ({comments.length})</h3>
            <div className="add-comment">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.currentTarget.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newComment = newMsg;
                    try {
                      if (event) {
                        const msg: Msg = await eventService.addEventMsg(event._id, newComment);
                        setComments((comments) => [msg, ...comments]);
                        setNewMsg('')
                      }
                    } catch (err) {
                      dispatch(setMsg({ txt: 'Cannot add comment', type: 'error' }));
                    }
                  }
                }}
              />
              <button className="signup-link" disabled={!newMsg} onClick={async () => {
                if (newMsg.trim()) {
                  const newComment = newMsg;
                  try {
                    if (event) {
                      const msg: Msg = await eventService.addEventMsg(event._id, newComment);
                      setComments((comments) => [msg, ...comments]);
                      setNewMsg('')
                    }
                  } catch (err) {
                    dispatch(setMsg({ txt: 'Cannot add comment', type: 'error' }));
                  }
                }
              }}>Post</button>
            </div>
            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((comment: any) => {
                  const avatarId = comment.proxy_wallet || comment.id || comment.by._id
                  return (
                    <div key={comment.id} className="comment-card flex">
                      <div className="user-avatar" style={getAvatarStyle(avatarId)}></div>
                      <div className="comment-content">
                        <div className="comment-header flex">
                          <span className="user-name">{comment.profile?.name || comment.by.username}</span>
                          <span className="comment-date">{timeAgo(comment.createdAt)}</span>
                          {comment.by?._id && (user?._id === comment.by._id || user?.isAdmin) &&
                            <Delete className="delete-icon" onClick={() => onDeleteMsg(comment._id)} />
                          }
                        </div>
                        <p className="comment-text">{comment?.body || comment.txt}</p>
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
      </section>

      <section
        className={`trading-section container ${isDrawerOpen ? 'drawer-open' : 'drawer-closed'}`}
        onClick={() => !isDrawerOpen ? setIsDrawerOpen(true) : null}
      >
        {isDrawerOpen && (
          <button className="drawer-close" onClick={(e) => { e.stopPropagation(); setIsDrawerOpen(false) }}>✕</button>
        )}
        <header className="trading-header flex justify-between align-center">
          <div className="trading-dirs flex">
            <div className={`trading-dir ${tradingDirection === 'buy' ? "active" : ""}`} onClick={() => dispatch(setTradingDirection('buy'))}>Buy</div>
            <div className={`trading-dir ${tradingDirection === 'sell' ? "active" : ""}`} onClick={() => dispatch(setTradingDirection('sell'))}>Sell</div>
          </div>
          <div className="trading-method">
            <Select.Root value={tradingMethod} onValueChange={(val) => dispatch(setTradingMethod(val as 'market' | 'limit'))}>
              <Select.Trigger className="trading-select radix-trigger">
                <Select.Value />
                <Select.Icon className="radix-icon"><ChevronDownIcon /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="radix-content" position="popper" sideOffset={5}>
                  <Select.Viewport>
                    <Select.Item value="limit" className="radix-item"><Select.ItemText>Limit</Select.ItemText></Select.Item>
                    <Select.Item value="market" className="radix-item"><Select.ItemText>Market</Select.ItemText></Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </header>

        <main>
          <div className="trading-buttons flex">
            {/* ── חדש: livePrices במקום activeMarket.outcomePrices ── */}
            <button className={`trading-button yes ${selectedOutcomeIndex === 0 ? "active" : ""} ${isSport ? "sport" : ""}`} onClick={() => dispatch(setSelectedOutcome('Yes'))}>
              {activeMarket?.outcomes[0]} <span>{livePrices[0]}¢</span>
            </button>
            <button className={`trading-button no ${selectedOutcomeIndex === 1 ? "active" : ""} ${isSport ? "sport" : ""}`} onClick={() => dispatch(setSelectedOutcome('No'))}>
              {activeMarket?.outcomes[1]} <span>{livePrices[1]}¢</span>
            </button>
          </div>
          {tradingMethod === 'market' ? (
            <>
              {tradingDirection === 'buy'
                ? (
                  <div className="market-order flex" ref={marketOrderRef}>
                    <div className="order-info">
                      <h4>Amount</h4>
                      <h6>Balance ${user?.cash?.toFixed(2)}</h6>
                    </div>
                    <input type="text" placeholder="$0" value={orderAmount ? `$${orderAmount}` : ''} onChange={handleInputChange} className="order-input" />
                  </div>)
                : (
                  <div className="market-order flex" ref={marketOrderRef}>
                    <div className="order-info"><h4>Shares</h4></div>
                    <input type="text" placeholder="0" value={orderAmount ? `${orderAmount}` : ''} onChange={handleInputChange} className="order-input" />
                  </div>
                )}
              <div className="money-btns flex">
                <button className="money-btn" onClick={() => addAmount(1)}>+$1</button>
                <button className="money-btn" onClick={() => addAmount(5)}>+$5</button>
                <button className="money-btn" onClick={() => addAmount(10)}>+$10</button>
                <button className="money-btn" onClick={() => addAmount(100)}>+$100</button>
                <button className="money-btn" onClick={() => {
                  if (tradingDirection === 'buy') {
                    setOrderAmount(user?.cash ? user.cash.toFixed(2) : '0')
                  } else {
                    const position = user?.portfolio?.find(pos => pos.marketId === activeMarket?.id && pos.outcome === selectedOutcome)
                    setOrderAmount(position ? position.shares.toString() : '0')
                  }
                }}>Max</button>
              </div>
            </>
          ) : (
            <>
              <div className="limit-order flex">
                <h4>Limit Price</h4>
                <div className="limit-input container flex" ref={limitOrderRef}>
                  <div className="limit-btn" onClick={() => handleLimit(-1)}>-</div>
                  <input type="text" placeholder="0.0¢" value={limitPrice ? `${limitPrice}¢` : ''} onChange={handleInputChange} />
                  <div className="limit-btn" onClick={() => handleLimit(+1)}>+</div>
                </div>
              </div>
              <div className="shares flex" ref={sharesOrderRef}>
                <h4>Shares</h4>
                <input
                  type="text"
                  placeholder="0"
                  value={shares}
                  onChange={(ev) => {
                    const val = ev.target.value.replace(/\D/g, '');
                    setShares(val === '' ? '' : +val);
                  }}
                />
              </div>
              <div className="money-btns flex">
                <button className="money-btn" onClick={() => setShares(prev => { const next = (Number(prev) || 0) - 100; return next > 0 ? next : prev || 0; })}>-100</button>
                <button className="money-btn" onClick={() => setShares(prev => { const next = (Number(prev) || 0) - 10; return next > 0 ? next : prev || 0; })}>-10</button>
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
              <h2>
                {`${tradingDirection === 'buy' ? 'To win' : `You'll receive`}`}
                {tradingMethod === 'market' && <Money className="money-icon" />}
              </h2>
              {tradingMethod === 'market' && (
                <h6 className="avg-price-display">Avg. Price: {(price * 100).toFixed(1)}¢</h6>
              )}
            </div>
            {tradingMethod === 'market' ? (
              <div className="to-win">${toWin}</div>
            ) : (
              <div className="limit-summary">
                {tradingDirection === 'buy' && (
                  <div className={`total`}>${limitPrice && shares ? ((+limitPrice / 100) * +shares).toFixed(2) : '0'}</div>
                )}
                <div className="to-win">
                  <Money className="money-icon limit" />
                  ${tradingDirection === 'buy' ? shares || 0 : limitPrice && shares ? ((+limitPrice / 100) * +shares).toFixed(2) : '0'}
                </div>
              </div>
            )}
          </div>

          {tradingDirection === 'buy' && (user?.cash === 0 || (user && user.cash === undefined)) ? (
            <div className="place-order-btn" onClick={onDeposit}>Deposit</div>
          ) : (
            <div className="button-wrapper">
              <button className="place-order-btn" onClick={() => onPlaceOrder(selectedOutcomeIndex)}>
                {`${user ? `${tradingDirection === 'buy' ? 'Buy' : 'Sell'}` : ''} ${user && selectedOutcomeIndex !== null ? activeMarket?.outcomes[selectedOutcomeIndex] : 'Trade'}`}
              </button>
            </div>
          )}
        </footer>
      </section>
    </div>
  )
}