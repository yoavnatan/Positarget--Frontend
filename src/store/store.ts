import { configureStore } from '@reduxjs/toolkit'
import { eventReducer } from './slices/event.slice'
import { userReducer } from './slices/user.slice'
import { systemReducer } from './slices/system.slice'

export const store = configureStore({
    reducer: {
        eventModule: eventReducer,
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
// import { loadEvents } from '../store/slices/event.slice'

// export function EventIndex() {
//     // TypeScript יודע ש-events הוא מערך של רכבים בזכות ה-useAppSelector
//     const { events, isLoading } = useAppSelector(state => state.eventModule)
//     const dispatch = useAppDispatch()

//     useEffect(() => {
//         dispatch(loadEvents()) // הדיספאץ' מכיר עכשיו Thunks אסינכרוניים
//     }, [])

//     // ...
// }