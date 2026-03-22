import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SystemState {
    isLoading: boolean
    msg: {
        txt: string
        type: 'success' | 'error' | 'info' | null
    } | null
    isAuthShown: boolean
    modalType: 'DEPOSIT' | 'AUTH' | 'SIDE_MENU' | null
}

const initialState: SystemState = {
    isLoading: false,
    msg: null,
    isAuthShown: false,
    modalType: null,
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
        setModalType(state, action: PayloadAction<SystemState['modalType']>) {
            state.modalType = action.payload
        },
    },
})

export const { setLoading, setMsg, clearMsg, setIsAuthShown, setModalType } = systemSlice.actions
export const systemReducer = systemSlice.reducer