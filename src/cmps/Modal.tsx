import { motion } from 'framer-motion';
import React from 'react';

// אנימציית הגדילה וה-Fade
const modalVariants = {
    initial: { opacity: 0, scale: 0.9, x: "-50%", y: "-50%" },
    animate: { opacity: 1, scale: 1, x: "-50%", y: "-50%" },
    exit: { opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }
};

export function Modal({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            layout
            className="modal"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.1, ease: "easeOut" }}
            // חשוב: לוודא שב-CSS ה-transform לא דורס את זה
            style={{ position: 'fixed', top: '50%', left: '50%', zIndex: 1001 }}
        >
            {children}
        </motion.div>
    );
}

