// src/store/slices/market.slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { marketService } from '../../services/market'
import { FilterBy, Market } from '../../types/market'

export const loadMarkets = createAsyncThunk<Market[], FilterBy>('market/loadMarkets', async (filterBy: FilterBy): Promise<Market[]> => {
    return await marketService.query(filterBy) as Promise<Market[]>
})

export const loadMarket = createAsyncThunk<Market, string>('market/loadMarket', async (marketId: string): Promise<Market> => {
    return await marketService.getById(marketId) as Market
})

export const removeMarket = createAsyncThunk('market/removeMarket', async (marketId: string) => {
    await marketService.remove(marketId)
    return marketId
})

export const addMarket = createAsyncThunk<Market, Market>('market/addMarket', async (market: Market): Promise<Market> => {
    const savedMarket = await marketService.save(market)
    return savedMarket as Market
})

export const updateMarket = createAsyncThunk<Market, Market>('market/updateMarket', async (market: Market): Promise<Market> => {
    const savedMarket = await marketService.save(market)
    return savedMarket as Market
})


const marketSlice = createSlice({
    name: 'market',
    initialState: {
        markets: [] as Market[],
        market: null as Market | null,
        isLoading: false, // רלוונטי רק למודול הרכבים
        isRemoving: false, // אפשר אפילו להפריד סטטוס למחיקה
        error: null as string | null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // טיפול בטעינת רכבים
            .addCase(loadMarkets.pending, (state) => {
                state.isLoading = true
            })
            .addCase(loadMarkets.fulfilled, (state, action) => {
                state.isLoading = false
                state.markets = action.payload
            })
            .addCase(loadMarkets.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Failed to load markets'
            })
            // טיפול במחיקה (בלי להפריע ל-isLoading הראשי)
            .addCase(removeMarket.pending, (state) => {
                state.isRemoving = true
            })
            .addCase(removeMarket.fulfilled, (state, action) => {
                state.isRemoving = false
                state.markets = state.markets.filter(c => c._id !== action.payload)
            })
            .addCase(addMarket.fulfilled, (state, action) => {
                state.markets.push(action.payload)
            })
            .addCase(updateMarket.fulfilled, (state, action) => {
                const idx = state.markets.findIndex(m => m._id === action.payload._id)
                if (idx !== -1) {
                    state.markets[idx] = action.payload
                }
            })
    }
})

export const marketReducer = marketSlice.reducer