// src/store/slices/event.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { eventService } from '../../services/event'
import { FilterBy, Event } from '../../types/event'

export const loadEvents = createAsyncThunk<Event[], FilterBy>('event/loadEvents', async (filterBy: FilterBy): Promise<Event[]> => {
    return await eventService.query(filterBy) as Promise<Event[]>
})

export const loadEvent = createAsyncThunk<Event, string>('event/loadEvent', async (eventId: string): Promise<Event> => {
    return await eventService.getById(eventId) as Event
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
        isLoading: false, // רלוונטי רק למודול הרכבים
        isRemoving: false, // אפשר אפילו להפריד סטטוס למחיקה
        error: null as string | null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // טיפול בטעינת רכבים
            .addCase(loadEvents.pending, (state) => {
                state.isLoading = true
            })
            .addCase(loadEvents.fulfilled, (state, action) => {
                state.isLoading = false
                state.events = action.payload
            })
            .addCase(loadEvents.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to load events'
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