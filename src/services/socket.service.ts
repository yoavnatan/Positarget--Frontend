import { io, Socket } from 'socket.io-client'

const BASE_URL = import.meta.env.DEV ? 'http://localhost:3030' : ''

let socket: Socket | null = null

function getSocket(): Socket {
    if (!socket) socket = io(BASE_URL, { withCredentials: true })
    return socket
}

// payload שמגיע מ-market:price_update
export type PriceUpdatePayload = {
    assetId: string
    price: string   // "0.72" — בין 0 ל-1
    side: string
    timestamp: string
}

// מנוי לעדכוני מחיר של assetId ספציפי (clobTokenId)
export function subscribeToMarketPrice(
    assetId: string,
    onUpdate: (data: PriceUpdatePayload) => void
): () => void {
    const s = getSocket()
    s.emit('subscribe:market', assetId)
    s.on('market:price_update', onUpdate)
    return () => {
        s.emit('unsubscribe:market', assetId)
        s.off('market:price_update', onUpdate)
    }
}

// מנוי ל-comments חדשים של event (מגיע מ-RTDS דרך הבקאנד)
export function subscribeToEventComments(
    eventId: string,
    onComment: (comment: any) => void
): () => void {
    const s = getSocket()
    s.emit('subscribe:event', eventId)
    s.on('event:new_comment', onComment)
    return () => {
        s.emit('unsubscribe:event', eventId)
        s.off('event:new_comment', onComment)
    }
}