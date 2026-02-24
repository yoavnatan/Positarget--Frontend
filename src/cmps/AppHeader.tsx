import { Link, NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../store/store'
import { logout } from '../store/slices/user.slice'
import { setIsAuthShown, setMsg } from '../store/slices/system.slice'
import logoImg from '/logo.png'
import Trending from '../assets/svg/trending.svg?react'
import Search from '../assets/svg/search.svg?react'
import Bell from '../assets/svg/bell.svg?react'
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
		<>
			<header className="app-header">
				<nav>
					<NavLink to="/" className="logo flex">
						<img src={logoImg} alt="Logo" />
						<div className='inter-font-bold'>Positarget</div>
					</NavLink>
					{/* <NavLink to="about">About</NavLink>
				<NavLink to="market">Markets</NavLink> */}

					<div className="search-container wide-screen">
						<input type="text" placeholder="Search" />
						<Search className="icon search medium" />
					</div>
					{user?.isAdmin && <NavLink to="/admin">Admin</NavLink>}

					{!user && (
						<>
							<div className="login-link" onClick={() => dispatch(setIsAuthShown(true))}>Log In</div>
							<div className="signup-link" onClick={() => dispatch(setIsAuthShown(true))}>Sign Up</div>
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
				<nav ref={carouselRef}
					className={` options-carusel carousel-container ${isScrolledLeft ? 'scrolled-left' : ''} ${isScrolledRight ? 'scrolled-right' : ''}`}>
					<NavLink to={`/`}><Trending className='icon trending' /> Trending</NavLink>
					<NavLink to={`/${"Breaking"}`}>Braeking</NavLink>
					<NavLink to={`/{${"New"}}`}>New</NavLink>

					<div style={{
						border: '1px solid rgb(230, 232, 234)',
						height: '16px',
						borderRadius: '7.2px',
						cursor: 'default',
					}}></div>

					<NavLink to={`/{${"Politics"}}`}>Politics</NavLink>
					<NavLink to={`/{${"Sports"}}`}>Sports</NavLink>
					<NavLink to={`/{${"Crypto"}}`}>Crypto</NavLink>
					<NavLink to={`/{${"Finance"}}`}>Finance</NavLink>
					<NavLink to={`/{${"Geopolitics"}}`}>Geopolitics</NavLink>
					<NavLink to={`/{${"Earnings"}}`}>Earnings</NavLink>
					<NavLink to={`/{${"Tech"}}`}>Tech</NavLink>
					<NavLink to={`/{${"Culture"}}`}>Culture</NavLink>
					<NavLink to={`/{${"World"}}`}>World</NavLink>
					<NavLink to={`/{${"Economy"}}`}>Economy</NavLink>
					<NavLink to={`/{${"Climate-science"}}`}>Climate & Science</NavLink>
					<NavLink to={`/{${"Mentions"}}`}>Mentions</NavLink>
					<NavLink to={`/{${"World"}}`}>World</NavLink>
					<NavLink to={`/{${"World"}}`}>World</NavLink>
				</nav>
			</header>

			<div className="border full"></div>
		</>
	)
}
