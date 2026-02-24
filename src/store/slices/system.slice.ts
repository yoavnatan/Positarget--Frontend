import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SystemState {
    // isLoading משמש כאן רק לטעינה גלובלית (כמו טעינת אפליקציה ראשונית)
    isLoading: boolean
    // הודעת שגיאה או הצלחה שתרצה להציג ב-Toast/Modal גלובלי
    msg: {
        txt: string
        type: 'success' | 'error' | 'info' | null
    } | null
    isAuthShown: boolean
}

const initialState: SystemState = {
    isLoading: false,
    msg: null,
    isAuthShown: false,
}

const systemSlice = createSlice({
    name: 'system',
    initialState,
    reducers: {
        // מאפשר להפעיל Loading ידנית מכל מקום (למשל לפני Logout)
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload
        },
        // ניהול הודעות למשתמש (במקום להשתמש ב-Event Bus ישן)
        setMsg(state, action: PayloadAction<SystemState['msg']>) {
            state.msg = action.payload
        },
        clearMsg(state) {
            state.msg = null
        },
        setIsAuthShown(state, action: PayloadAction<boolean>) {
            state.isAuthShown = action.payload
        },
    },
})

export const { setLoading, setMsg, clearMsg, setIsAuthShown } = systemSlice.actions
export const systemReducer = systemSlice.reducer