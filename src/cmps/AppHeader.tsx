import { Link, NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../store/store'
import { logout } from '../store/slices/user.slice'
import { setMsg } from '../store/slices/system.slice'

export function AppHeader() {
	const dispatch = useAppDispatch()
	const { user } = useAppSelector((state) => state.userModule)

	const navigate = useNavigate()

	async function onLogout() {
		try {
			dispatch(logout())
			navigate('/')
			dispatch(setMsg({ txt: 'Good Bye', type: 'success' }))

		} catch (err) {
			dispatch(setMsg({ txt: 'Cannot logout', type: 'error' }))
		}
	}

	return (
		<header className="app-header full">
			<nav>
				<NavLink to="/" className="logo">
					E2E Demo
				</NavLink>
				<NavLink to="about">About</NavLink>
				<NavLink to="market">Markets</NavLink>
				<NavLink to="chat">Chat</NavLink>
				<NavLink to="review">Review</NavLink>

				{user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}

				{!user && <NavLink to="auth/login" className="login-link">Login</NavLink>}
				{user && (
					<div className="user-info">
						<Link to={`user/${user._id}`}>
							{user.imgUrl && <img src={user.imgUrl} />}
							{user.username}
						</Link>
						<button onClick={onLogout}>logout</button>
					</div>
				)}
			</nav>
		</header>
	)
}
