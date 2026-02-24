import { Link, NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../store/store'
import { logout } from '../store/slices/user.slice'
import { setMsg } from '../store/slices/system.slice'
import logoImg from '/logo.png'
import Trending from '../assets/svg/trending.svg?react'
import { useRef, useState, useEffect } from 'react'

export function AppHeader() {
	const carouselRef = useRef<HTMLDivElement>(null)
	const [isScrolledLeft, setIsScrolledLeft] = useState(false)
	const [isScrolledRight, setIsScrolledRight] = useState(true)

	const dispatch = useAppDispatch()
	const { user } = useAppSelector((state) => state.userModule)
	const navigate = useNavigate()


	useEffect(() => {
		const handleScroll = () => {
			if (!carouselRef.current) return
			const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
			setIsScrolledLeft(scrollLeft > 2)
			const hasMoreToScroll = Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2
			setIsScrolledRight(hasMoreToScroll)
		}

		const carousel = carouselRef.current
		if (carousel) {
			carousel.addEventListener('scroll', handleScroll)
			handleScroll()
			const timeoutId = setTimeout(handleScroll, 100)

			return () => {
				carousel.removeEventListener('scroll', handleScroll)
				clearTimeout(timeoutId)
			}
		}
	}, [])


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
		<header className="app-header">
			<nav>
				<NavLink to="/" className="logo flex">
					<img src={logoImg} alt="Logo" />
					<div className='inter-font-bold'>Positarget</div>
				</NavLink>
				{/* <NavLink to="about">About</NavLink>
				<NavLink to="market">Markets</NavLink> */}


				{user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}

				{!user && (
					<>
						<NavLink to="auth/login" className="login-link">Log In</NavLink>
						<NavLink to="auth/signup" className="signup-link">Sign Up</NavLink>
					</>
				)}
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
			<nav
				ref={carouselRef}
				className={` options-carusel carousel-container ${isScrolledLeft ? 'scrolled-left' : ''} ${isScrolledRight ? 'scrolled-right' : ''}`}>


				<div><Trending className='icon trending' /> Trending</div>
				<div>Braeking</div>
				<div>New</div>
				<div>Politics</div>
				<div>Sports</div>
				<div>Crypto</div>
				<div>Finance</div>
				<div>Geopolitics</div>
				<div>Earnings</div>
				<div>Tech</div>
				<div>Culture</div>
				<div>World</div>
			</nav>
		</header>
	)
}
