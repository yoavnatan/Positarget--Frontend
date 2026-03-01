import { User } from "./user.type"

export type MarketType = 'binary' | 'multi' | 'up-down' | 'sports';

export type BinaryOptions = { Yes: number; No: number };
export interface MultiOption {
    id: string;
    subtitle: string;
    yesShares: number;
    noShares: number;
}
export interface Market {
    _id: string
    title: string
    type: MarketType;
    status: 'open' | 'closed'
    options: BinaryOptions | MultiOption[];
    endDate: number
    description: string
    labels: string[]
    msgs: Msg[]
    createdAt?: Date
    imgUrl: string
}

export type FilterBy = {
    txt: string
    status?: 'open' | 'closed' | 'all'
    sortField: string
    sortDir: 1 | -1
    pageIdx?: number
}

export interface Msg {
    id: string;
    by: User;
    txt: string;
}

