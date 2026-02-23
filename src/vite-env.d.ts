/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LOCAL: string
    // כאן תוכל להוסיף משתנים נוספים בעתיד:
    // readonly VITE_API_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}