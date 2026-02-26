import { Link, NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../store/store'
import { fetchUserDetails, logout, updateUserCash } from '../store/slices/user.slice'
import { setIsAuthShown, setIsModalShown, setMsg } from '../store/slices/system.slice'
import logoImg from '/logo.png'
import Trending from '../assets/svg/trending.svg?react'
import Search from '../assets/svg/search.svg?react'
import Bell from '../assets/svg/bell.svg?react'
import Arrow from '../assets/svg/drop-arrow.svg?react'
import SleepingBell from '../assets/svg/sleeping-bell.svg?react'
import New from '../assets/svg/new.svg?react'
import Popular from '../assets/svg/fire.svg?react'
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import useClickOutside from '../customHooks/useClickOutside'
import { Modal } from './Modal'
import { useForm } from '../customHooks/useForm'

export function AppHeader() {
	const carouselRef = useRef<HTMLDivElement>(null)
	const [isScrolledLeft, setIsScrolledLeft] = useState(false)
	const [isScrolledRight, setIsScrolledRight] = useState(true)
	const { isModalShown } = useAppSelector((state) => state.systemModule)
	const dispatch = useAppDispatch()
	const { user } = useAppSelector((state) => state.userModule)
	const navigate = useNavigate()
	const [depositFields, handleDepositChange] = useForm({ amount: 0 })
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false)
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const timeoutRef = useRef<number | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLDivElement>(null);
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

	useEffect(() => {
		if (user) dispatch(fetchUserDetails(user._id))
	}, [user])

	const handleMouseEnter = () => {
		// אם המשתמש חזר לתפריט בתוך פחות משניה - בטל את הסגירה המתוכננת
		if (timeoutRef.current) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		timeoutRef.current = window.setTimeout(() => {
			setIsUserMenuOpen(true);
		}, 100);
	};

	const handleMouseLeave = () => {
		// קבע סגירה לעוד שניה (1000ms)
		timeoutRef.current = window.setTimeout(() => {
			setIsUserMenuOpen(false);
		}, 400);
	};


	async function onLogout() {
		try {
			dispatch(logout())
			navigate('/')
			dispatch(setMsg({ txt: 'Good Bye', type: 'success' }))
			setIsUserMenuOpen(false);


		} catch (err) {
			dispatch(setMsg({ txt: 'Cannot logout', type: 'error' }))
		}
	}

	async function handleDeposit(ev: React.MouseEvent) {
		ev.preventDefault()
		const amount = depositFields.amount

		if (amount <= 0) return // בדיקה בסיסית

		try {
			// כאן תפעיל את ה-action שלך, לדוגמה:
			// await dispatch(updateUserCash(amount))
			await dispatch(updateUserCash(amount)).unwrap()
			console.log('Depositing:', amount)
			dispatch(setIsModalShown(false))
			dispatch(setMsg({ txt: `Successfully deposited $${amount}`, type: 'success' }))
		} catch (err) {
			dispatch(setMsg({ txt: 'Deposit failed', type: 'error' }))
		}
	}

	return (
		<>
			{isModalShown && (<Modal>
				<header>Deposit Funds</header>
				<input type="number"
					placeholder="Amount"
					name="amount"
					value={depositFields.amount}
					onChange={handleDepositChange}
				/>
				<div className="btns">
					<button className="confirm-btn signup-link" onClick={(ev) => handleDeposit(ev)}>Confirm</button>
					<button className="cancel-btn login-link" onClick={() => dispatch(setIsModalShown(false))}>Cancel</button>
				</div>
			</Modal>)}

			<header className="app-header full">
				<div className="inner-container">
					<nav>
						<NavLink to="/" className="logo flex">
							<img src={logoImg} alt="Logo" />
							<div className='inter-font-bold'>Positarget</div>
						</NavLink>
						{/* <NavLink to="about">About</NavLink>
				<NavLink to="market">Markets</NavLink> */}

						<div className="search-container wide-screen" ref={searchRef} onClick={() => setIsSearchOpen(true)}>
							<input type="text" placeholder="Search" />
							<Search className="icon search medium" />
							<div className={`search-modal ${isSearchOpen ? 'open' : ''}`}>
								<header>Browse</header>
								<div className="browse-container">
									<div className="browse-item"><New /> New</div>
									<div className="browse-item"><Trending /> Trending</div>
									<div className="browse-item"><Popular /> Popular</div>
								</div>
								<header>Topics</header>
								<div className="topics-container">
									<div className="topic-item">Topic</div>
									<div className="topic-item">Topic</div>
									<div className="topic-item">Topic</div>
									<div className="topic-item">Topic</div>
									<div className="topic-item">Topic</div>
									<div className="topic-item">Topic</div>
									<div className="topic-item">Topic</div>
									<div className="topic-item">Topic</div>
								</div>
							</div>
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
								<div className="info-item flex ">
									<h5 >Portfolio</h5>
									<h5 className="sum"> $0.00</h5>

								</div>
								<div className="info-item flex">
									<h5>Cash</h5>
									<h5 className='sum'>${user.cash || '0.00'}</h5>
								</div>
								<div className="signup-link" onClick={() => dispatch(setIsModalShown(true))}>Deposit</div>
								<div className="bell info-item" ref={buttonRef} onClick={(ev) => {
									ev.preventDefault()
									setIsNotificationsMenuOpen(prev => !prev)
								}
								} ><Bell className="icon bell medium" /></div>
								<AnimatePresence>
									{isNotificationsMenuOpen && (
										<motion.div
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.95 }}
											transition={{ duration: 0.2 }}
											style={{
												position: 'absolute',
												top: '100%',
												right: 0,   // הצמדה לימין, שנה ל-left אם צריך
												zIndex: 999 // מבטיח שיהיה מעל אלמנטים אחרים
											}}
										>
											<motion.div
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 5 }}
												transition={{ duration: 0.3 }}
											>
												<section
													ref={dropdownRef}
													className={`dropdown-menu notifications ${isNotificationsMenuOpen ? 'open' : ''}`}
												>

													<header>Nofitications</header>
													<div className="inner-container">
														<SleepingBell className="icon sleeping-bell" />
														<div>You have no notifications.</div>
													</div>

												</section>
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>
								<div className="img-container"
									onMouseEnter={handleMouseEnter}
									onMouseLeave={handleMouseLeave} >
									<img className="user-img" src="/img/grad1.png"
									/>
									<Arrow className="icon arrow" />
								</div>
								<AnimatePresence>
									{isUserMenuOpen && (
										<motion.div
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.95 }}
											transition={{ duration: 0.2 }}
											style={{
												position: 'absolute',
												top: '100%',
												right: 0,   // הצמדה לימין, שנה ל-left אם צריך
												zIndex: 999 // מבטיח שיהיה מעל אלמנטים אחרים
											}}
										>
											<motion.div
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 5 }}
												transition={{ duration: 0.3 }}
											>
												<section
													className={`dropdown-menu ${isUserMenuOpen ? 'open' : ''}`}
													onMouseEnter={handleMouseEnter}
													onMouseLeave={handleMouseLeave}
												>
													<ul className="clean-list">
														<li><Link to={`user/${user._id}`}>
															{user.username}
														</Link>
														</li>
														<li ><a onClick={onLogout}>Logout</a></li>
													</ul>
												</section>
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

						)}
					</nav>
					<nav ref={carouselRef}
						className={` options-carusel carousel-container ${isScrolledLeft ? 'scrolled-left' : ''} ${isScrolledRight ? 'scrolled-right' : ''}`}>
						<NavLink to={`/`}><Trending className='icon trending' /> Trending</NavLink>
						<NavLink to={`/${"Breaking"}`}>Braeking</NavLink>
						<NavLink to={`/{${"New"}}`}>New</NavLink>

						<div className="divider" style={{
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
				</div >
			</header >

			{/* <div className="border full"></div> */}

		</>
	)
}
