// cmps/PortfolioSummary.tsx
import NumberFlow from '@number-flow/react'

export function PortfolioSummary({ stats }: { stats: any }) {
    if (!stats) return null
    const { currentTotalValue, totalPnl, pnlPercent } = stats
    const isPos = totalPnl >= 0

    return (
        <div className="portfolio-header">
            <span className="label">Total Equity</span>
            <div className="equity-amount">
                <NumberFlow
                    value={currentTotalValue}
                    format={{ style: 'currency', currency: 'USD' }}
                />
            </div>
            <div className={`pnl-badge ${isPos ? 'pos' : 'neg'}`}>
                {isPos ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)} ({Math.abs(pnlPercent).toFixed(2)}%)
                <span className="all-time">All Time</span>
            </div>
        </div>
    )
}