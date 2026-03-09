export function makeId(length = 6) {
    var txt = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (var i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return txt
}

export function makeLorem(size = 100) {
    var words = ['The sky', 'above', 'the port', 'was', 'the color of television', 'tuned', 'to', 'a dead channel', '.', 'All', 'this happened', 'more or less', '.', 'I', 'had', 'the story', 'bit by bit', 'from various people', 'and', 'as generally', 'happens', 'in such cases', 'each time', 'it', 'was', 'a different story', '.', 'It', 'was', 'a pleasure', 'to', 'burn']
    var txt = ''
    while (size > 0) {
        size--
        txt += words[Math.floor(Math.random() * words.length)] + ' '
    }
    return txt
}

export function getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min //The maximum is inclusive and the minimum is inclusive 
}


export function randomPastTime() {
    const HOUR = 1000 * 60 * 60
    const DAY = 1000 * 60 * 60 * 24
    const WEEK = 1000 * 60 * 60 * 24 * 7

    const pastTime = getRandomIntInclusive(HOUR, WEEK)
    return Date.now() - pastTime
}
export function debounce<T extends (...args: any[]) => any>(func: T, timeout: number = 300) {
    let timer: ReturnType<typeof setTimeout> | null = null

    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timer) clearTimeout(timer)

        timer = setTimeout(() => {
            func.apply(this, args)
        }, timeout)
    }
}

export function saveToStorage<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value))
}

export function loadFromStorage(key: string) {
    const data = localStorage.getItem(key)
    return (data) ? JSON.parse(data) : undefined
}
function stringToColor(str: string) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const r = (hash & 0xFF0000) >> 16
    const g = (hash & 0x00FF00) >> 8
    const b = hash & 0x0000FF
    return `rgb(${r % 255}, ${g % 255}, ${b % 255})`
}

export function getAvatarStyle(userId: string = 'guest') {
    // פונקציה פנימית ליצירת מספר ייחודי מהמחרוזת
    const getHash = (str: string) => {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash)
        }
        return Math.abs(hash)
    }

    const hash = getHash(userId)

    // יצירת גוונים שונים על בסיס ה-Hash
    // (n * 137.5) זו נוסחה מתמטית מעולה לפיזור צבעים (Golden Angle)
    const h1 = (hash) % 360
    const h2 = (hash + 90) % 360
    const h3 = (hash + 180) % 360
    const h4 = (hash + 270) % 360

    // בניית הצבעים בפורמט HSL (Hue, Saturation, Lightness)
    const c1 = `hsl(${h1}, 70%, 60%)`
    const c2 = `hsl(${h2}, 80%, 50%)`
    const c3 = `hsl(${h3}, 75%, 65%)`
    const c4 = `hsl(${h4}, 70%, 55%)`
    const base = `hsl(${(hash + 45) % 360}, 60%, 40%)`

    return {
        backgroundColor: base,
        backgroundImage: `
            radial-gradient(at 66% 77%, ${c1} 0px, transparent 55%),
            radial-gradient(at 29% 97%, ${c2} 0px, transparent 55%),
            radial-gradient(at 99% 86%, ${c3} 0px, transparent 55%),
            radial-gradient(at 29% 88%, ${c4} 0px, transparent 55%)
        `,
        borderRadius: '50%',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
    }
}

export function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
    };

    for (const [key, value] of Object.entries(intervals)) {
        const count = Math.floor(seconds / value);
        if (count >= 1) {
            return `${count} ${key}${count > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}