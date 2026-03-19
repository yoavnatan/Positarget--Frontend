import { User, UserCred } from '../../types/user.type'
import { httpService } from '../http.service'
import { makeId } from '../util.service'

const STORAGE_KEY_LOGGEDIN_USER = 'loggedinUser'
const AUTH_ENDPOINT = 'auth'
const USER_ENDPOINT = 'user'

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

// --- פונקציות AUTH (עובדות מול authService בבק) ---

async function login(userCred: UserCred) {
	try {
		const user = await httpService.post<User>(`${AUTH_ENDPOINT}/login`, userCred)
		if (user) return saveLoggedinUser(user)
	} catch (err) {
		console.error('Login failed:', err)
		throw err
	}
}

async function signup(userCred: UserCred) {
	try {
		const user = await httpService.post<User>(`${AUTH_ENDPOINT}/signup`, userCred)
		return saveLoggedinUser(user)
	} catch (err) {
		console.error('Signup failed:', err)
		throw err
	}
}

async function logout() {
	try {
		await httpService.post(`${AUTH_ENDPOINT}/logout`)
		sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
	} catch (err) {
		console.error('Logout failed:', err)
	}
}

// --- פונקציות USER (עובדות מול userService בבק) ---

async function getUsers(): Promise<User[]> {
	return await httpService.get<User[]>(USER_ENDPOINT)
}

async function getById(userId: string): Promise<User> {
	return await httpService.get<User>(`${USER_ENDPOINT}/${userId}`)
}

async function remove(userId: string) {
	return await httpService.delete(`${USER_ENDPOINT}/${userId}`)
}

async function update(user: User) {
	try {
		const updatedUser = await httpService.put<User>(`${USER_ENDPOINT}/${user._id}`, user)

		// עדכון המשתמש המחובר אם הוא זה שהתעדכן
		const loggedinUser = getLoggedinUser()
		if (loggedinUser && loggedinUser._id === updatedUser._id) {
			saveLoggedinUser(updatedUser)
		}
		return updatedUser
	} catch (err) {
		console.error('Update failed:', err)
		throw err
	}
}

// --- פונקציות עזר (לוקאליות בפרונט) ---

function getLoggedinUser(): User | null {
	const userData = sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER)
	return userData ? JSON.parse(userData) : null
}

function saveLoggedinUser(user: User): User {
	// אנחנו מניחים שהשרת כבר הוריד את הסיסמה (Password) מהאובייקט
	const userToSave = { ...user }
	sessionStorage.setItem(STORAGE_KEY_LOGGEDIN_USER, JSON.stringify(userToSave))
	return userToSave
}

function getEmptyCredentials(): UserCred {
	return { username: '', password: '', email: '' }
}

async function getGuestCredentials() {

	try {
		const guestUser = await httpService.post('auth/guest')
		return guestUser
	} catch (err) {
		console.error('Server guest failed, falling back to local', err)
	}


	return {
		username: 'guest_' + makeId(),
		password: 'guest',
		email: 'Guest'
	}
}

