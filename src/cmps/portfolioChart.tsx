import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function PortfolioChart({ data }: { data: any[] }) {
    const hasData = data && data.length > 1;

    const displayData = hasData
        ? data
        : Array.from({ length: 10 }, (_, i) => ({ name: i, value: 50, date: 'N/A' }));

    let chartColor = '#00aa5d';
    let yDomain: any = ['auto', 'auto'];

    if (hasData) {
        // 1. קביעת צבע (הפסד או רווח)
        const firstVal = data[0].value;
        const lastVal = data[data.length - 1].value;
        chartColor = lastVal >= firstVal ? '#00aa5d' : '#ff4d4d';

        // 2. חישוב ידני של המינימום והמקסימום כדי להכריח "זום" מקסימלי
        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        // אם ההפרש קטן מאוד, אנחנו יוצרים טווח הדוק מאוד סביב הערכים
        // זה יגרום גם לתנודה של 0.1$ להיראות כמו הר
        const margin = (maxVal - minVal) * 0.1 || 0.1;
        yDomain = [minVal - margin, maxVal + margin];
    } else {
        chartColor = '#007aff';
        yDomain = [0, 100];
    }

    return (
        <div style={{ width: '100%', height: '250px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                        </linearGradient>
                    </defs>

                    <XAxis dataKey="name" hide={true} />

                    {/* כאן ה-YAxis מקבל את הטווח ההדוק */}
                    <YAxis domain={['auto', 'auto']} hide={true} allowDecimals={true} />

                    <Tooltip
                        isAnimationActive={false}
                        cursor={{ stroke: '#e0e0e0', strokeWidth: 1, strokeDasharray: '4 4' }}
                        content={({ active, payload }) => {
                            if (!active || !payload?.length || !hasData) return null;
                            const { value, date } = payload[0].payload;
                            return (
                                <div style={{
                                    backgroundColor: '#111', padding: '8px 12px', borderRadius: '8px', color: '#fff'
                                }}>
                                    <div style={{ color: chartColor, fontWeight: 'bold' }}>${value.toFixed(2)}</div>
                                    <div style={{ color: '#6d7278', fontSize: '10px' }}>{date}</div>
                                </div>
                            );
                        }}
                    />

                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartColor}
                        strokeWidth={3} // עובי קו מודגש
                        fill="url(#chartGradient)"
                        fillOpacity={1}
                        isAnimationActive={false}
                        connectNulls={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}