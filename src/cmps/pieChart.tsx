import { Pie, PieChart } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';


export default function PieChartWithPaddingAngle({ isAnimationActive = true, yes, no }: { isAnimationActive?: boolean, yes: number, no: number }) {

    const fillColor = (yes < 30) ? 'var(--button-red-hover)' : (yes < 50) ? 'var(--pie-orange)' : 'var(--button-green-hover)'


    const data = [
        { name: 'Yes', value: +yes, fill: fillColor },
        { name: 'No', value: +no, fill: 'var(--border-gray)' }
    ];


    return (
        <PieChart style={{ width: '70px', maxWidth: '200px', maxHeight: '100vh', aspectRatio: 1 }} responsive>
            <Pie
                data={data}
                innerRadius="85%"
                outerRadius="100%"
                startAngle={190}
                endAngle={-10}
                stroke="none"
                /* מרכז המעגל - נשים אותו באמצע ה-SVG */
                cx="50%" /* ממקם במרכז */
                cy="70%"
                // Corner radius is the rounded edge of each pie slice
                cornerRadius="50%"
                fill="#8884d8"
                // padding angle is the gap between each pie slice
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
            />
            {/* <RechartsDevtools /> */}
        </PieChart>
    );
}