import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { userService } from '../../services/user'
import { User } from '../../types/user.type'
import { RootState } from '../store'

// טיפוסים


interface UserState {
    user: User | null
    users: User[]
    watchedUser: User | null
    count: number
    isLoading: boolean // לטעינת רשימת משתמשים או פרופיל
    lastUser: User | null
    selectedOutcome: 'Yes' | 'No' | ''
}

const initialState: UserState = {
    user: userService.getLoggedinUser(),
    users: [],
    watchedUser: null,
    count: 10,
    isLoading: false,
    lastUser: null,
    selectedOutcome: 'Yes',
}

// --- Async Thunks ---

export const loadUsers = createAsyncThunk<User[]>('user/loadUsers', async (): Promise<User[]> => {
    return await userService.getUsers()
})

export const loadUser = createAsyncThunk<User, string>('user/loadUser', async (userId: string): Promise<User> => {
    return await userService.getById(userId) as User
})

export const login = createAsyncThunk('user/login', async (credentials: any) => {
    const user = await userService.login(credentials)
    return user
})

export const signup = createAsyncThunk('user/signup', async (credentials: any) => {
    const user = await userService.signup(credentials)
    return user
})

export const logout = createAsyncThunk('user/logout', async () => {
    await userService.logout()
})

export const removeUser = createAsyncThunk('user/removeUser', async (userId: string) => {
    await userService.remove(userId)
    return userId
})

export const updateUser = createAsyncThunk('user/updateUser', async (user: User) => {
    const updatedUser = await userService.update(user)
    return updatedUser
})

// --Financial actions --

export const fetchUserDetails = createAsyncThunk(
    'user/fetchDetails',
    async (userId: string) => {
        const user: Pick<User, '_id' | 'cash' | 'portfolio'> = await userService.getById(userId)
        return { cash: user.cash, portfolio: user.portfolio }
    }
)

export const updateUserCash = createAsyncThunk(
    'user/updateCash',
    async (amount: number, { getState }) => {
        const { user } = (getState() as RootState).userModule
        if (!user) throw new Error('No logged in user')

        const updatedUser = { ...user, cash: (user.cash || 0) + amount }

        // עדכון ב-DB דרך ה-Service
        const savedUser = await userService.update(updatedUser)

        // עדכון ה-sessionStorage (רק השדות המותרים)
        userService.saveLoggedinUser(savedUser)

        return savedUser.cash
    }
)

export const toggleFavorite = createAsyncThunk(
    'user/toggleFavorite',
    async (eventId: string, { getState }) => {
        const { user } = (getState() as RootState).userModule
        if (!user) throw new Error('Not logged in')

        const isFavorite = user.favoriteEvents?.includes(eventId)
        const updatedFavorites = isFavorite
            ? user.favoriteEvents?.filter(id => id !== eventId)
            : [...(user.favoriteEvents || []), eventId]

        const updatedUser = { ...user, favoriteEvents: updatedFavorites }
        return await userService.update(updatedUser)
    }
)
// --- Slice ---

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        increment(state) { state.count++ },
        decrement(state) { state.count-- },
        changeCount(state, action: PayloadAction<number>) { state.count += action.payload },
        setScore(state, action: PayloadAction<number>) {
            if (state.user) {
                userService.saveLoggedinUser(state.user)
            }
        },
        setSelectedOutcome(state, action: PayloadAction<'Yes' | 'No' | ''>) {
            state.selectedOutcome = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            // Load Users
            .addCase(loadUsers.pending, (state) => { state.isLoading = true })
            .addCase(loadUsers.fulfilled, (state, action) => {
                state.isLoading = false
                state.users = action.payload
            })
            // Login / Signup
            .addCase(login.fulfilled, (state, action) => {
                if (action.payload) {
                    state.user = action.payload
                }
            })
            .addCase(login.rejected, (state) => {
                state.user = null
                console.log('not logged in')
            }
            )

            .addCase(signup.fulfilled, (state, action) => { state.user = action.payload })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null
                state.watchedUser = null
            })
            // Remove User
            .addCase(removeUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u._id !== action.payload)
            })
            .addCase(fetchUserDetails.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.cash = action.payload.cash
                    state.user.portfolio = action.payload.portfolio
                }
            })
            .addCase(updateUserCash.fulfilled, (state, action) => {
                if (state.user) {
                    state.user = { ...state.user, cash: action.payload }
                }
            })
            .addCase(updateUser.pending, (state, action) => {
                if (state.user && state.user._id) {
                    state.lastUser = { ...state.user }
                }
                const updatedUserData = action.meta.arg
                if (state.user && state.user._id === updatedUserData._id) {
                    state.user = { ...state.user, ...updatedUserData }
                }

                state.users = state.users.map(u =>
                    u._id === updatedUserData._id ? { ...u, ...updatedUserData } : u
                )

            })
            .addCase(updateUser.fulfilled, (state, action) => {
                if (state.user && state.user._id === action.payload._id) {
                    state.user = action.payload
                }
                state.users = state.users.map(u => u._id === action.payload._id ? action.payload : u)
                state.lastUser = null
            })
            .addCase(updateUser.rejected, (state) => {
                if (state.lastUser) {
                    state.user = state.lastUser
                }
                state.lastUser = null
            })
    },

})

export const { increment, decrement, changeCount, setScore, setSelectedOutcome } = userSlice.actions
export const userReducer = userSlice.reducer