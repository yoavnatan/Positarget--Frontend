import { User } from "./user.type"

export interface Market {
    _id: string
    title: string
    status: 'open' | 'closed'
    yesShares: number
    noShares: number
    endDate: number
    description: string
    msgs: Msg[]
}

export type FilterBy = {
    txt: string
    status?: 'open' | 'closed' | 'all'
    sortField: string
    sortDir: 1 | -1
}

export interface Msg {
    id: string;
    by: User;
    txt: string;
}