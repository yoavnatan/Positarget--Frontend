export const storageService = {
    query,
    get,
    post,
    put,
    remove,
}

function query<T>(entityType: string, delay = 500): Promise<T[]> {
    const data = localStorage.getItem(entityType)
    const entities: T[] = data ? JSON.parse(data) : []
    return new Promise(resolve => setTimeout(() => resolve(entities), delay))
}

function get<T extends {
    _id: string
}>(entityType: string, entityId: string): Promise<T> {
    return query<T>(entityType).then(entities => {
        const entity = entities.find(entity => entity._id === entityId)
        if (!entity) throw new Error(`Get failed, cannot find entity with id: ${entityId} in: ${entityType}`)
        return entity
    })
}

function post<T extends { _id?: string }>(entityType: string, newEntity: T): Promise<T> {
    newEntity._id = _makeId()
    return query(entityType).then(entities => {
        entities.push(newEntity)
        _save(entityType, entities)
        return newEntity
    })
}

function put<T extends { _id: string }>(entityType: string, updatedEntity: T): Promise<T> {
    return query<T>(entityType).then(entities => {
        const idx = entities.findIndex((entity: T) => entity._id === updatedEntity._id)
        if (idx < 0) throw new Error(`Update failed, cannot find entity with id: ${updatedEntity._id} in: ${entityType}`)
        const entityToUpdate = { ...entities[idx], ...updatedEntity }
        entities.splice(idx, 1, entityToUpdate)
        _save(entityType, entities)
        return entityToUpdate
    })
}

function remove<T extends { _id: string }>(entityType: string, entityId: string): Promise<void> {
    return query<T>(entityType).then(entities => {
        const idx = entities.findIndex((entity: T) => entity._id === entityId)
        if (idx < 0) throw new Error(`Remove failed, cannot find entity with id: ${entityId} in: ${entityType}`)
        entities.splice(idx, 1)
        _save(entityType, entities)
    })
}

// Private functions

function _save<T>(entityType: string, entities: T[]) {
    localStorage.setItem(entityType, JSON.stringify(entities))
}

function _makeId(length = 5) {
    var text = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}