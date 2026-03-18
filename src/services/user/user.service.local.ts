import { User, UserCred } from '../../types/user.type'
import { storageService } from '../async-storage.service'
import { makeId } from '../util.service'

const STORAGE_KEY_LOGGEDIN_USER = 'loggedinUser'

export const userService = {
    login,
    logout,
    signup,
    getUsers,
    getById,
    remove,
    update,
    getLoggedinUser,
    saveLoggedinUser,
    getEmptyCredentials,
    getGuestCredentials,
}


createGuestUser()

async function getUsers() {
    const users: User[] = await storageService.query('user')
    return users.map(user => {
        delete user.password
        return user
    })
}

async function getById(userId: string) {
    return await storageService.get('user', userId)
}

function remove(userId: string) {
    return storageService.remove('user', userId)
}

async function update(user: User) {
    if (!user._id) throw new Error('User ID is required')
    const updatedUser = await storageService.put('user', user)

    // When admin updates other user's details, do not update loggedinUser
    const loggedinUser = getLoggedinUser()
    if (loggedinUser && loggedinUser._id === updatedUser._id) {
        saveLoggedinUser(updatedUser)
    }
    return updatedUser
}

async function login(userCred: UserCred) {
    const users: User[] = await storageService.query('user')
    const user = users.find(user => user.username === userCred.username)
    if (!user) throw new Error('Invalid username')
    if (user.password !== userCred.password) throw new Error('Invalid password')
    if (user) return saveLoggedinUser(user)
}

async function signup(userCred: UserCred) {

    if (!userCred.username) throw new Error('Username is required')

    const userToSave: User = {
        username: userCred.username,
        password: userCred.password,
        _id: makeId(),
        firstName: '',
        lastName: '',
        isAdmin: false,
        imgUrl: '',
        email: userCred.email || '' // Ensure email is always defined
    }
    const user = await storageService.post('user', userToSave)

    return saveLoggedinUser(user)
}

async function logout() {
    sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
}

function getLoggedinUser() {
    const userData = sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER)
    return userData ? JSON.parse(userData) : null
}

function saveLoggedinUser(user: User) {

    const { password, ...userToSave } = user;

    sessionStorage.setItem(STORAGE_KEY_LOGGEDIN_USER, JSON.stringify(userToSave));
    return userToSave;
}

// To quickly create an admin user, uncomment the next line
// _createAdmin()
async function _createAdmin() {
    const user: User = {
        _id: '',
        username: 'admin',
        password: 'admin',
        firstName: 'Mustafa Adminsky',
        lastName: 'Adminsky',
        email: 'default@example.com',
        isAdmin: true,
        imgUrl: 'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png',
    }

    const newUser = await storageService.post('user', user)

}

function getEmptyCredentials() {
    return {
        username: '',
        password: '',
        email: ''
    }
}

function getGuestCredentials() {
    return {
        username: 'guest',
        password: 'guest',
        email: 'Guest'
    }
}

async function createGuestUser() {
    const guestUser: UserCred = {
        username: 'guest',
        password: 'guest',
        email: 'Guest',
    }
    const users: User[] = await storageService.query('user')
    const existingGuest = users.find(user => user.username === guestUser.username)
    if (existingGuest) return
    const user = await signup(guestUser)
    return user
}

