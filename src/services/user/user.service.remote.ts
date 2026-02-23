import { User, UserCred } from '../../types/user.type'
import { httpService } from '../http.service'

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
}

function getUsers(): Promise<User[]> {
	return httpService.get(`user`, null)
}

async function getById(userId: string): Promise<User> {
	const user = await httpService.get(`user/${userId}`, null) as User
	return user
}

function remove(userId: string) {
	return httpService.delete(`user/${userId}`, null)
}

async function update(user: User) {
	const updateUser: User = await httpService.put(`user/${user._id}`, user)

	// When admin updates other user's details, do not update loggedinUser
	const loggedinUser = getLoggedinUser() // Might not work because its defined in the main service???
	if (loggedinUser._id === updateUser._id) saveLoggedinUser(updateUser)

	return updateUser
}

async function login(userCred: UserCred) {
	const user: User = await httpService.post('auth/login', userCred)
	if (user) return saveLoggedinUser(user)
}

async function signup(userCred: UserCred) {

	const user: User = await httpService.post('auth/signup', userCred)
	return saveLoggedinUser(user)
}

async function logout() {
	sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
	return await httpService.post('auth/logout')
}

function getLoggedinUser() {
	const userData = sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER)
	return userData ? JSON.parse(userData) : null
}

function saveLoggedinUser(user: User) {
	user = {
		_id: user._id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		username: user.username,
		imgUrl: user.imgUrl,
		isAdmin: user.isAdmin
	}
	sessionStorage.setItem(STORAGE_KEY_LOGGEDIN_USER, JSON.stringify(user))
	return user
}

function getEmptyCredentials() {
	return {
		username: '',
		password: '',
		email: ''
	}
}