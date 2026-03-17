import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function PortfolioChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return <div style={{ width: '100%', height: '250px' }} />;
    }

    const isPositive = data[data.length - 1].value >= data[0].value;
    const chartColor = isPositive ? '#00aa5d' : '#ff4d4d';

    return (
        <div style={{ width: '100%', height: '250px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                        </linearGradient>
                    </defs>

                    <XAxis dataKey="name" hide={true} />
                    <YAxis domain={['auto', 'auto']} hide={true} />

                    <Tooltip
                        isAnimationActive={false}
                        cursor={{ stroke: '#e0e0e0', strokeWidth: 1, strokeDasharray: '4 4' }}
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
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
                        strokeWidth={2}
                        fill="url(#chartGradient)"
                        fillOpacity={1}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}