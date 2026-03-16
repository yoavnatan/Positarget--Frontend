import { motion } from "framer-motion";

export function NumberTicker({ value }: { value: number }) {
    const valString = Math.abs(Math.round(value)).toString().padStart(2, '0');
    const digits = valString.split("");

    return (
        <div style={{ display: "inline-flex", direction: "ltr" }}>
            {digits.map((digit, i) => (
                <Digit key={i} digit={digit} />
            ))}
        </div>
    );
}

function Digit({ digit }: { digit: string }) {
    const num = parseInt(digit);
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="digit-window">
            <motion.div
                animate={{ y: `-${num * 100}%` }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                className="digit-column"
            >
                {numbers.map((n) => (
                    <div key={n} className="digit-number">
                        {n}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}