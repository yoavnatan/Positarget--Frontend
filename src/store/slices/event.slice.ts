// src/store/slices/event.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { eventService } from '../../services/event'
import { FilterBy, Event } from '../../types/event'
import { setSelectedOutcome } from './user.slice';

export const loadEvents = createAsyncThunk<
    { events: Event[]; page: number }, // מחזיר גם את העמוד כדי שנדע מה לעשות ב-Reducer
    { filterBy: FilterBy; categorie: string; page?: number }
>(
    'event/loadEvents',
    async ({ filterBy, categorie, page = 0 }): Promise<{ events: Event[]; page: number }> => {
        // שים לב: כאן אתה צריך להעביר את ה-page לפונקציה query ב-service
        const events = await eventService.query(filterBy, categorie, page) as Event[]
        return { events, page }
    }
)

export const loadEvent = createAsyncThunk<Event, string>(
    'event/loadEvent',
    async (eventId: string, { dispatch }): Promise<Event> => {
        const event = await eventService.fetchEventById(eventId) as Event

        dispatch(setSelectedOutcome("Yes")) // משנה state ב-user slice

        return event
    })

export const removeEvent = createAsyncThunk('event/removeEvent', async (eventId: string) => {
    await eventService.remove(eventId)
    return eventId
})

export const addEvent = createAsyncThunk<Event, Event>('event/addEvent', async (event: Event): Promise<Event> => {
    const savedEvent = await eventService.save(event)
    return savedEvent as Event
})

export const updateEvent = createAsyncThunk<Event, Event>('event/updateEvent', async (event: Event): Promise<Event> => {
    const savedEvent = await eventService.save(event)
    return savedEvent as Event
})


const eventSlice = createSlice({
    name: 'event',
    initialState: {
        events: [] as Event[],
        event: null as Event | null,
        isLoading: false, // רלוונטי רק למודול הנוכחי
        isRemoving: false, // אפשר אפילו להפריד סטטוס למחיקה
        error: null as string | null,
        hasMore: true
    },
    reducers: {

    },
    extraReducers: (builder) => {
        builder
            // טיפול בטעינת רכבים
            .addCase(loadEvents.pending, (state) => {
                state.isLoading = true
            })
            .addCase(loadEvents.fulfilled, (state, action) => {
                state.isLoading = false
                const { events, page } = action.payload

                // אם חזרו פחות מ-10 אירועים, כנראה שאין טעם לנסות לטעון עוד דף בעתיד
                state.hasMore = events.length >= 10

                if (page === 0) {
                    state.events = events
                } else {
                    const existingIds = new Set(state.events.map(ev => ev._id))
                    const uniqueNewEvents = events.filter(event => !existingIds.has(event._id))
                    state.events.push(...uniqueNewEvents)
                }
            })
            .addCase(loadEvents.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to load events'
            })
            .addCase(loadEvent.pending, (state) => {
                state.isLoading = true
            })
            .addCase(loadEvent.fulfilled, (state, action) => {
                state.isLoading = false
                state.event = action.payload
            })
            .addCase(loadEvent.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to load event'
            })
            // טיפול במחיקה (בלי להפריע ל-isLoading הראשי)
            .addCase(removeEvent.pending, (state) => {
                state.isRemoving = true
            })
            .addCase(removeEvent.fulfilled, (state, action) => {
                state.isRemoving = false
                state.events = state.events.filter(c => c._id !== action.payload)
            })
            .addCase(addEvent.fulfilled, (state, action) => {
                state.events.push(action.payload)
            })
            .addCase(updateEvent.fulfilled, (state, action) => {
                const idx = state.events.findIndex(m => m._id === action.payload._id)
                if (idx !== -1) {
                    state.events[idx] = action.payload
                }
            })
    }
})

export const eventReducer = eventSlice.reducer