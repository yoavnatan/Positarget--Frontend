import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function PortfolioChart({ data }: { data: any[] }) {
    const hasData = data && data.length >= 2;

    // נתונים ריקים לתצוגה ראשונית
    const displayData = hasData
        ? data
        : Array.from({ length: 10 }, (_, i) => ({ name: i, value: 0, date: 'N/A' }));

    let chartColor = '#00aa5d'; // ברירת מחדל ירוק
    let yDomain: any = ['auto', 'auto'];

    if (hasData) {
        // השוואה בין הנקודה האחרונה (Live) לראשונה (Purchase)
        const firstVal = data[0].value;
        const lastVal = data[data.length - 1].value;

        // צבע ירוק אם הרווחנו, אדום אם הפסדנו
        chartColor = lastVal >= firstVal ? '#00aa5d' : '#ff4d4d';

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        // יצירת "זום" חכם על הגרף
        const margin = (maxVal - minVal) * 0.15 || 5;
        yDomain = [minVal - margin, maxVal + margin];
    }

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <XAxis dataKey="name" hide={true} />
                    <YAxis domain={yDomain} hide={true} />

                    <Tooltip
                        isAnimationActive={false}
                        cursor={{ stroke: '#e0e0e0', strokeWidth: 1 }}
                        content={({ active, payload }) => {
                            if (!active || !payload?.length || !hasData) return null;
                            const { value, date } = payload[0].payload;
                            return (
                                <div style={{
                                    backgroundColor: 'rgba(17, 17, 17, 0.9)',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    border: `1px solid ${chartColor}`
                                }}>
                                    <div style={{ color: chartColor, fontWeight: 'bold', fontSize: '16px' }}>
                                        ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>{date}</div>
                                </div>
                            );
                        }}
                    />

                    <Area
                        type="monotone" // החלקה של הקו
                        dataKey="value"
                        stroke={chartColor}
                        strokeWidth={3}
                        fill="url(#chartGradient)"
                        isAnimationActive={true}
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}