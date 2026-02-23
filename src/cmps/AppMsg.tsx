import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { clearMsg } from '../store/slices/system.slice'

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

    if (!msg) return null

    return (
        <section className={`app-msg ${msg.type}`}>
            <button onClick={onCloseMsg}>X</button>
            <p>{msg.txt}</p>
        </section>
    )
}

// Using: dispatch(setMsg({ txt: 'Hello', type: 'success' }))