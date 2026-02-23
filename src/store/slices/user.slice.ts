import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { userService } from '../../services/user'
import { User } from '../../types/user.type'

// טיפוסים


interface UserState {
    user: User | null
    users: User[]
    watchedUser: User | null
    count: number
    isLoading: boolean // לטעינת רשימת משתמשים או פרופיל
}

const initialState: UserState = {
    user: userService.getLoggedinUser(),
    users: [],
    watchedUser: null,
    count: 10,
    isLoading: false
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
    },
})

export const { increment, decrement, changeCount, setScore } = userSlice.actions
export const userReducer = userSlice.reducer