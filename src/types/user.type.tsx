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
    favoriteEvents?: string[] // רשימת אירועים מועדפים
}

export interface UserCred {
    username?: string
    email?: string
    password: string
}

export type Position = {
    eventId: string
    outcome: string
    shares: number
    avgPrice: number
}