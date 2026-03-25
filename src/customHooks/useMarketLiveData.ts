import { useEffect, useRef, useState } from 'react'
import { subscribeToMarketPrice } from '../services/socket.service'

/**
 * מנוי למחירים חיים של activeMarket.
 * 
 * מחזיר:
 * - livePrices: state — מעדכן רק את הכפתורים ואת חישוב toWin
 * - onNewChartPoint: callback — מועבר ל-PriceChart כ-prop, לא גורם לרינדור של EventDetails
 */
export function useMarketLiveData(
    clobTokenIds: string[],
    initialPrices: number[],
    onNewChartPoint: (point: { time: number; value: number }) => void
) {
    const [livePrices, setLivePrices] = useState<number[]>(initialPrices)

    // sync כשמחליפים activeMarket
    useEffect(() => {
        setLivePrices(initialPrices)
    }, [clobTokenIds[0]])

    useEffect(() => {
        if (!clobTokenIds?.length) return

        const unsubscribers = clobTokenIds.map((assetId, idx) =>
            subscribeToMarketPrice(assetId, (data) => {
                const priceFloat = parseFloat(data.price)   // 0–1
                const priceInCents = Math.round(priceFloat * 100)

                // עדכון כפתורים ו-toWin — רק הקומפוננטות שצורכות livePrices יתרנדרו
                if (idx === 0) {
                    setLivePrices(prev => {
                        if (prev[0] === priceInCents) return prev   // אין שינוי — לא מרנדר
                        const updated = [...prev]
                        updated[0] = priceInCents
                        return updated
                    })

                    // עדכון גרף — ישירות דרך series.update(), אפס רינדור של EventDetails
                    onNewChartPoint({
                        time: Math.floor(Date.now() / 1000),
                        value: priceFloat,   // 0–1, בדיוק מה ש-PriceChart מצפה
                    })
                } else {
                    setLivePrices(prev => {
                        if (prev[idx] === priceInCents) return prev
                        const updated = [...prev]
                        updated[idx] = priceInCents
                        return updated
                    })
                }
            })
        )

        return () => unsubscribers.forEach(fn => fn())
    }, [clobTokenIds[0]])

    return { livePrices }
}