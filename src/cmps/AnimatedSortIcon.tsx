import { motion } from 'framer-motion';

export function AnimatedSortIcon({ isSortOn }: { isSortOn: boolean }) {
    // ערכים התלויים במצב
    const topCircleX = isSortOn ? 7 : 11;
    const bottomCircleX = isSortOn ? 11 : 7;

    const topLeftLineX2 = isSortOn ? 4.75 : 8.75;
    const topRightLineX1 = isSortOn ? 9.25 : 13.25;

    const bottomLeftLineX1 = isSortOn ? 8.75 : 4.75;
    const bottomRightLineX2 = isSortOn ? 13.25 : 9.25;

    // הגדרות אנימציה קבועות
    const transition = { type: "spring" as const, stiffness: 300, damping: 30 };

    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <g>
                {/* קו עליון שמאל - הוספנו initial={false} למנוע undefined */}
                <motion.line
                    x1="1.75" y1="5.25" y2="5.25"
                    initial={false}
                    animate={{ x2: topLeftLineX2 }}
                    transition={transition}
                />
                {/* קו עליון ימין */}
                <motion.line
                    y1="5.25" y2="5.25" x2="16.25"
                    initial={false}
                    animate={{ x1: topRightLineX1 }}
                    transition={transition}
                />
                {/* עיגול עליון */}
                <motion.circle
                    cy="5.25" r="2.25"
                    initial={false}
                    animate={{ cx: topCircleX }}
                    transition={transition}
                />

                {/* קו תחתון שמאל */}
                <motion.line
                    y1="12.75" y2="12.75" x1="1.75"
                    initial={false}
                    animate={{ x2: bottomLeftLineX1 }}
                    transition={transition}
                />
                {/* קו תחתון ימין */}
                <motion.line
                    y1="12.75" y2="12.75" x2="16.25"
                    initial={false}
                    animate={{ x1: bottomRightLineX2 }}
                    transition={transition}
                />
                {/* עיגול תחתון */}
                <motion.circle
                    cy="12.75" r="2.25"
                    initial={false}
                    animate={{ cx: bottomCircleX }}
                    transition={transition}
                />
            </g>
        </svg>
    );
}