import { User } from "./user.type"

export interface Market { // השוק הספציפי בתוך האירוע
    id: string;           // ה-conditionId
    question: string;
    outcomePrices: number[]; // ["0.55", "0.45"]
    outcomes: string[];      // ["Yes", "No"]
    clobTokenIds: string[];
}

export interface Event { // זה ה"כרטיס" (Card) שלך
    _id: string;             // ה-Event ID
    title: string;           // הכותרת של האירוע
    description: string;
    createdAt: Date | number;
    imgUrl: string;
    endDate: Date | number;
    status: 'open' | 'closed';
    markets: Market[];       // מערך השווקים שבתוך האירוע
    category: string;        // "Politics", "Crypto" וכו'
    volume: number;
    msgs: Msg[];
    labels: string[]           // מערך ההודעות שקשורות לאירוע
}
export type FilterBy = {
    txt: string
    labels: string[]
    favoritesOnly: boolean
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

