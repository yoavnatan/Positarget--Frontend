import { Link, NavLink, useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../store/store'
import { logout } from '../store/slices/user.slice'
import { setIsAuthShown, setModalType, setMsg } from '../store/slices/system.slice'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useClickOutside from '../customHooks/useClickOutside'
import { getAvatarStyle } from '../services/util.service'

// Assets
import logoImg from '/logo.png'
import Trending from '../assets/svg/trending.svg?react'
import Search from '../assets/svg/search.svg?react'
import Bell from '../assets/svg/bell.svg?react'
import Arrow from '../assets/svg/drop-arrow.svg?react'
import SleepingBell from '../assets/svg/sleeping-bell.svg?react'
import New from '../assets/svg/new.svg?react'
import Popular from '../assets/svg/fire.svg?react'

export function AppHeader() {
	const carouselRef = useRef<HTMLDivElement>(null)
	const [isScrolledLeft, setIsScrolledLeft] = useState(false)
	const [isScrolledRight, setIsScrolledRight] = useState(true)
	const dispatch = useAppDispatch()
	const { user } = useAppSelector((state) => state.userModule)
	const navigate = useNavigate()

	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false)
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [serachTerm, setSearchTerm] = useState('')
	const [searchParams] = useSearchParams();

	const timeoutRef = useRef<number | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLDivElement>(null);

	useClickOutside(dropdownRef, () => setIsNotificationsMenuOpen(false), buttonRef);
	useClickOutside(searchRef, () => setIsSearchOpen(false), null);

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

	const handleMouseEnter = () => {
		if (timeoutRef.current) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		timeoutRef.current = window.setTimeout(() => {
			setIsUserMenuOpen(true);
		}, 100);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = window.setTimeout(() => {
			setIsUserMenuOpen(false);
		}, 400);
	};

	async function onLogout() {
		try {
			dispatch(logout())
			// navigate('/')
			dispatch(setMsg({ txt: 'Good Bye', type: 'success' }))
			setIsUserMenuOpen(false);
		} catch (err) {
			dispatch(setMsg({ txt: 'Cannot logout', type: 'error' }))
		}
	}

	function hadnleSearchInput(value: string) {
		setSearchTerm(value)
	}

	async function onSearch() {
		const newSearchParams = new URLSearchParams(searchParams);
		newSearchParams.set('q', serachTerm);
		setIsSearchOpen(false)
		setSearchTerm('')
		navigate('/search/?' + newSearchParams.toString())
	}

	function onTopicClicked(ev: React.MouseEvent) {
		ev.stopPropagation()
		const topic = (ev.target as HTMLDivElement).innerText
		setIsSearchOpen(false)
		navigate(`/${topic}`)
	}

	function onBrowse(ev: React.MouseEvent, sortBy?: string) {
		ev.stopPropagation()
		setIsSearchOpen(false)
		navigate(`/search?q=&sort=${sortBy}`)
	}

	function getPorfolioSum() {
		if (!user?.portfolio) return 0
		const positionsSum = user.portfolio.reduce((acc, position) => {
			const positionValue = position.shares * position.avgPrice / 100
			return acc + positionValue
		}, 0)
		return positionsSum + (user.cash || 0)
	}

	return (
		<header className="app-header full">
			<div className="inner-container">
				<nav>
					<NavLink to="/" className="logo flex">
						<img src={logoImg} alt="Logo" />
						<div className='inter-font-bold'>Positarget</div>
					</NavLink>

					<div className="search-container wide-screen" ref={searchRef} onClick={() => setIsSearchOpen(true)}>
						<form onSubmit={(ev) => {
							ev.preventDefault()
							onSearch()
						}}>
							<input type="text" placeholder="Search" value={serachTerm} onChange={(ev) => hadnleSearchInput(ev.target.value)} className={`${isSearchOpen ? 'open' : ''}`} />
							<Search className="icon search medium" />
							<div className={`search-modal ${isSearchOpen ? 'open' : ''}`}>
								<header>Browse</header>
								<div className="browse-container">
									<div className="browse-item" onClick={(ev) => onBrowse(ev, 'Newest')}><New /> New</div>
									<div className="browse-item" onClick={(ev) => onBrowse(ev, 'Trending')}><Trending /> Trending</div>
									<div className="browse-item" onClick={(ev) => onBrowse(ev, 'Volume')} ><Popular /> Popular</div>
								</div>
								<header>Topics</header>
								<div className="topics-container">
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Politics</div>
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)} >Sports</div>
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Crypto</div>
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Finance</div>
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Climate</div>
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Tech</div>
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Economy</div>
									<div className="topic-item" onClick={(ev) => onTopicClicked(ev)}>Culture</div>
								</div>
							</div>
						</form>
					</div>

					{!user && (
						<>
							<div className="login-link" onClick={() => dispatch(setModalType('AUTH'))}>Log In</div>
							<div className="signup-link" onClick={() => dispatch(setModalType('AUTH'))}>Sign Up</div>
						</>
					)}

					{user && (
						<div className="user-info">
							<Link to="/portfolio">
								<div className="info-item flex">
									<h5>Portfolio</h5>
									<h5 className="sum">${getPorfolioSum().toFixed(2) || '0.00'}</h5>
								</div>
							</Link>
							<Link to="/portfolio">
								<div className="info-item flex">
									<h5>Cash</h5>
									<h5 className='sum'>${user.cash?.toFixed(2) || '0.00'}</h5>
								</div></Link>
							<div className="signup-link" onClick={() => dispatch(setModalType('DEPOSIT'))}>Deposit</div>
							<div className="bell info-item" ref={buttonRef} onClick={(ev) => {
								ev.preventDefault()
								setIsNotificationsMenuOpen(prev => !prev)
							}}><Bell className="icon bell medium" /></div>

							<AnimatePresence>
								{isNotificationsMenuOpen && (
									<motion.div animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 999 }}>
										<section ref={dropdownRef} className={`dropdown-menu notifications ${isNotificationsMenuOpen ? 'open' : ''}`}>
											<header>Notifications</header>
											<div className="inner-container">
												<SleepingBell className="icon sleeping-bell" />
												<div>You have no notifications.</div>
											</div>
										</section>
									</motion.div>
								)}
							</AnimatePresence>

							<div className="img-container" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
								<div className="user-img" style={getAvatarStyle(user._id)}></div>
								<Arrow className="icon arrow" />
							</div>

							<AnimatePresence>
								{isUserMenuOpen && (
									<motion.div animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', top: '100%', right: 0, zIndex: 999 }}>
										<section className={`dropdown-menu ${isUserMenuOpen ? 'open' : ''}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
											<ul className="clean-list">
												<li><Link to={`user/${user._id}`}>{user.username}</Link></li>
												<li><a onClick={onLogout}>Logout</a></li>
											</ul>
										</section>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}
				</nav>

				<nav ref={carouselRef} className={`options-carusel carousel-container ${isScrolledLeft ? 'scrolled-left' : ''} ${isScrolledRight ? 'scrolled-right' : ''}`}>
					<NavLink to={`/`}><Trending className='icon trending' /> Trending</NavLink>
					<NavLink to={`/${"Breaking"}`}>Braeking</NavLink>
					<NavLink to={`/{${"New"}}`}>New</NavLink>
					<div className="divider" style={{ border: '1px solid rgb(230, 232, 234)', height: '16px', borderRadius: '7.2px', cursor: 'default' }}></div>
					<NavLink to={`/${"Politics"}`}>Politics</NavLink>
					<NavLink to={`/${"Sports"}`}>Sports</NavLink>
					<NavLink to={`/${"Crypto"}`}>Crypto</NavLink>
					<NavLink to={`/${"Finance"}`}>Finance</NavLink>
					<NavLink to={`/${"Geopolitics"}`}>Geopolitics</NavLink>
					<NavLink to={`/${"Tech"}`}>Tech</NavLink>
					<NavLink to={`/${"Culture"}`}>Culture</NavLink>
					<NavLink to={`/${"World"}`}>World</NavLink>
					<NavLink to={`/${"Economy"}`}>Economy</NavLink>
					<NavLink to={`/${"Climate-science"}`}>Climate & Science</NavLink>
					<NavLink to={`/${"Sports"}`}>Sports</NavLink>
					<NavLink to={`/${"Crypto"}`}>Crypto</NavLink>
					<NavLink to={`/${"Finance"}`}>Finance</NavLink>
					<NavLink to={`/${"Geopolitics"}`}>Geopolitics</NavLink>
				</nav>
			</div>
		</header>
	)
}