import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SystemState {
    // isLoading משמש כאן רק לטעינה גלובלית (כמו טעינת אפליקציה ראשונית)
    isLoading: boolean
    // הודעת שגיאה או הצלחה שתרצה להציג ב-Toast/Modal גלובלי
    msg: {
        txt: string
        type: 'success' | 'error' | 'info' | null
    } | null
}

const initialState: SystemState = {
    isLoading: false,
    msg: null,
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
        }
    },
})

export const { setLoading, setMsg, clearMsg } = systemSlice.actions
export const systemReducer = systemSlice.reducer