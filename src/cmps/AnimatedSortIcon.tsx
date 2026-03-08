import { motion } from 'framer-motion';

export function AnimatedSortIcon({ isSortOn }: { isSortOn: boolean }) {
    // ערכים לפי ה-SVG ששלחת
    const topCircleX = isSortOn ? 7 : 11;
    const bottomCircleX = isSortOn ? 11 : 7;

    // חישוב אורכי הקווים ביחס לעיגולים
    const topLeftLineX2 = isSortOn ? 4.75 : 8.75;
    const topRightLineX1 = isSortOn ? 9.25 : 13.25;

    const bottomLeftLineX1 = isSortOn ? 8.75 : 4.75;
    const bottomRightLineX2 = isSortOn ? 13.25 : 9.25;

    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <g>
                {/* קו עליון שמאל */}
                <motion.line x1="1.75" y1="5.25" y2="5.25" animate={{ x2: topLeftLineX2 }} transition={{ duration: 0.3 }} />
                {/* קו עליון ימין */}
                <motion.line y1="5.25" y2="5.25" x2="16.25" animate={{ x1: topRightLineX1 }} transition={{ duration: 0.3 }} />
                {/* עיגול עליון */}
                <motion.circle cy="5.25" r="2.25" animate={{ cx: topCircleX }} transition={{ duration: 0.3 }} />

                {/* קו תחתון שמאל */}
                <motion.line y1="12.75" y2="12.75" x1="1.75" animate={{ x2: bottomLeftLineX1 }} transition={{ duration: 0.3 }} />
                {/* קו תחתון ימין */}
                <motion.line y1="12.75" y2="12.75" x2="16.25" animate={{ x1: bottomRightLineX2 }} transition={{ duration: 0.3 }} />
                {/* עיגול תחתון */}
                <motion.circle cy="12.75" r="2.25" animate={{ cx: bottomCircleX }} transition={{ duration: 0.3 }} />
            </g>
        </svg>
    );
}