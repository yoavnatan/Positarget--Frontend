export interface User {
    _id: string
    email: string
    firstName: string
    lastName: string
    isAdmin: boolean
    username: string
    imgUrl?: string
    password?: string

    cash?: number          // יתרת מזומן
    portfolio?: Position[] // החזקות לפי מרקט
}

export interface UserCred {
    username?: string
    email?: string
    password: string
}

export type Position = {
    marketId: string
    outcome: 'YES' | 'NO'
    shares: number
    avgPrice: number
}