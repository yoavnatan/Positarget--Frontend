import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { clearMsg } from '../store/slices/system.slice'
import { AnimatePresence, motion } from 'framer-motion'

export function AppMsg() {
    const msg = useSelector((state: RootState) => state.systemModule.msg)
    const dispatch = useDispatch()
    const timeoutIdRef = useRef<number | null>(null)

    useEffect(() => {
        if (msg) {
            if (timeoutIdRef.current) {
                window.clearTimeout(timeoutIdRef.current)
            }

            timeoutIdRef.current = window.setTimeout(() => {
                onCloseMsg()
            }, 3000)
        }

        return () => {
            if (timeoutIdRef.current) window.clearTimeout(timeoutIdRef.current)
        }
    }, [msg])

    function onCloseMsg() {
        dispatch(clearMsg())
    }

    return (
        <AnimatePresence>
            {msg && (
                <motion.section
                    className={`app-msg flex ${msg.type}`}
                    initial={{ opacity: 0, y: 10, x: '-50%' }} // כניסה מלמטה
                    animate={{ opacity: 1, y: 0, x: '-50%' }}  // מצב סטטי
                    exit={{ opacity: 0, y: 10, x: '-50%' }}    // יציאה חלקה
                    transition={{ duration: 0.2 }}
                >
                    <p>{msg.txt}</p>
                    {/* <button onClick={onCloseMsg}>X</button> */}
                </motion.section>
            )}
        </AnimatePresence>
    )
}

// Using: dispatch(setMsg({ txt: 'Hello', type: 'success' }))