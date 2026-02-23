import { configureStore } from '@reduxjs/toolkit'
import { marketReducer } from './slices/market.slice'
import { userReducer } from './slices/user.slice'
import { systemReducer } from './slices/system.slice'

export const store = configureStore({
    reducer: {
        marketModule: marketReducer,
        userModule: userReducer,
        systemModule: systemReducer,
    },
})

import { useSelector, useDispatch, TypedUseSelectorHook } from 'react-redux'

// ... (שאר הגדרות ה-Store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Hooks מוקלדים לשימוש בכל האפליקציה
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

//Usage: import { useAppDispatch, useAppSelector } from '../store/store'
// import { loadMarkets } from '../store/slices/market.slice'

// export function MarketIndex() {
//     // TypeScript יודע ש-markets הוא מערך של רכבים בזכות ה-useAppSelector
//     const { markets, isLoading } = useAppSelector(state => state.marketModule)
//     const dispatch = useAppDispatch()

//     useEffect(() => {
//         dispatch(loadMarkets()) // הדיספאץ' מכיר עכשיו Thunks אסינכרוניים
//     }, [])

//     // ...
// }