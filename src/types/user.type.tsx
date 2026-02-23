export interface User {
    _id: string
    email: string
    firstName: string
    lastName: string
    isAdmin: boolean
    username: string
    imgUrl?: string
    password?: string
}

export interface UserCred {
    username?: string
    email?: string
    password: string
}